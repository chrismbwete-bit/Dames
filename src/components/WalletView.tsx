import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Check, Gift, Info, Lock, Coins } from 'lucide-react';
import { useGameStore, Currency, VIRTUAL_WALLET_CDF, VIRTUAL_WALLET_USD } from '../store/gameStore';

const METHODS = [
  { id: 'airtel', name: 'Airtel Money', icon: '🔴' },
  { id: 'mpesa', name: 'M-Pesa', icon: '🟢' },
  { id: 'orange', name: 'Orange Money', icon: '🟠' },
  { id: 'vodacom', name: 'Vodacom', icon: '🔵' },
];

export default function WalletView() {
  const { currentUser, deposit, withdraw, transactions, adminSettings } = useGameStore();
  const [tab, setTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('airtel');
  const [currency, setCurrency] = useState<Currency>(adminSettings.defaultCurrency);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const balanceCDF = currentUser.balance;
  const balanceUSD = balanceCDF / adminSettings.cdfRate;
  const virtualCDF = currentUser.virtualBalanceCDF ?? VIRTUAL_WALLET_CDF;
  const virtualUSD = currentUser.virtualBalanceUSD ?? VIRTUAL_WALLET_USD;
  const virtualExhausted = virtualCDF <= 0 && virtualUSD <= 0;

  const quickAmountsCDF = [500, 1000, 5000, 10000, 50000, 100000];
  const quickAmountsUSD = [1, 5, 10, 25, 50, 100];
  const quickAmounts = currency === 'CDF' ? quickAmountsCDF : quickAmountsUSD;

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const amtCDF = currency === 'CDF' ? Number(amount) : Number(amount) * adminSettings.cdfRate;
    if (tab === 'withdraw' && amtCDF > currentUser.balance) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    setLoading(true);
    const amtCDF = currency === 'CDF' ? Number(amount) : Number(amount) * adminSettings.cdfRate;
    setTimeout(() => {
      if (tab === 'deposit') {
        deposit(amtCDF, METHODS.find(m => m.id === method)?.name || method, currency);
      } else {
        withdraw(amtCDF, METHODS.find(m => m.id === method)?.name || method, currency);
      }
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        setStep('form');
        setAmount('');
      }, 2500);
    }, 1500);
  };

  const amtCDF = currency === 'CDF' ? Number(amount) : Number(amount) * adminSettings.cdfRate;
  const insufficient = tab === 'withdraw' && amtCDF > currentUser.balance;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header Balance */}
      <div className="p-6 bg-gradient-to-b from-black/60 to-transparent">
        <p className="text-white/50 text-sm">Votre Wallet Principal</p>
        <div className="flex items-end gap-3 mt-1">
          <p className="text-4xl font-bold font-orbitron gradient-gold">{balanceCDF.toLocaleString()}</p>
          <p className="text-white/40 text-sm mb-1">FC</p>
        </div>
        <p className="text-white/30 text-xs">≈ ${balanceUSD.toFixed(2)} USD <span className="text-white/20">(1 USD = {adminSettings.cdfRate.toLocaleString()} FC)</span></p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total gagné', value: `${currentUser.totalEarnings.toLocaleString()} FC`, color: 'text-green-400' },
            { label: 'Victoires', value: currentUser.totalWins, color: 'text-yellow-400' },
            { label: 'Taux V/D', value: `${currentUser.totalWins + currentUser.totalLosses > 0 ? Math.round(currentUser.totalWins / (currentUser.totalWins + currentUser.totalLosses) * 100) : 0}%`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-3 text-center border border-white/5">
              <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Wallet Virtuel Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border relative overflow-hidden ${
            virtualExhausted
              ? 'bg-gray-900/50 border-gray-700/50'
              : 'bg-gradient-to-br from-green-900/40 to-yellow-900/30 border-green-500/30'
          }`}
        >
          {/* Fond décoratif */}
          {!virtualExhausted && (
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
          )}

          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${virtualExhausted ? 'bg-gray-700' : 'bg-green-500/20'}`}>
              {virtualExhausted ? <Lock size={18} className="text-gray-500" /> : <Gift size={18} className="text-green-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-sm ${virtualExhausted ? 'text-gray-500' : 'text-green-300'}`}>
                  Wallet Virtuel {virtualExhausted ? '(Épuisé)' : '🎁'}
                </h3>
                {!virtualExhausted && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">DÉMO</span>
                )}
              </div>

              {virtualExhausted ? (
                <div>
                  <p className="text-gray-500 text-xs mb-3">Votre solde virtuel est épuisé.</p>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <p className="text-orange-300 text-xs font-medium">⚠️ Dépôt requis</p>
                    <p className="text-white/50 text-xs mt-1">
                      Vous ne pouvez plus faire de défis payants sans déposer de l'argent réel dans votre wallet principal.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-white/40 text-xs mb-1">🇨🇩 Francs Congolais</p>
                      <p className="text-green-400 font-bold text-lg">{virtualCDF.toLocaleString()}</p>
                      <p className="text-white/20 text-xs">FC virtuels</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-white/40 text-xs mb-1">🇺🇸 Dollars US</p>
                      <p className="text-green-400 font-bold text-lg">${virtualUSD.toFixed(2)}</p>
                      <p className="text-white/20 text-xs">USD virtuels</p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Utilisé</span>
                      <span>{Math.round((1 - virtualCDF / VIRTUAL_WALLET_CDF) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(virtualCDF / VIRTUAL_WALLET_CDF) * 100}%` }}
                        className="bg-gradient-to-r from-green-500 to-yellow-500 h-1.5 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="mt-3 bg-white/5 rounded-xl p-3 flex items-start gap-2">
                    <Info size={14} className="text-white/30 mt-0.5 shrink-0" />
                    <div className="text-white/30 text-xs space-y-1">
                      <p>✅ Utilisation pour défis et paris test</p>
                      <p>✅ Jouer contre l'IA (gratuit)</p>
                      <p>❌ Non retirable — argent de démo uniquement</p>
                      <p>❌ Gains virtuels non convertibles en argent réel</p>
                      <p>❌ Non accessible au wallet administrateur</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 rounded-xl p-1">
          <button onClick={() => setTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${tab === 'overview' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>
            <Coins size={16} /> Historique
          </button>
          <button onClick={() => { setTab('deposit'); setStep('form'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${tab === 'deposit' ? 'bg-green-500 text-white' : 'text-white/60 hover:text-white'}`}>
            <ArrowDownLeft size={16} /> Dépôt
          </button>
          <button onClick={() => { setTab('withdraw'); setStep('form'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${tab === 'withdraw' ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white'}`}>
            <ArrowUpRight size={16} /> Retrait
          </button>
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              📋 Historique des transactions
            </h3>
            <div className="space-y-2">
              {transactions.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-white/30 text-sm">Aucune transaction pour l'instant</p>
                  <p className="text-white/20 text-xs mt-1">Faites un dépôt pour commencer à jouer!</p>
                </div>
              )}
              {transactions.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${tx.amount > 0 ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {tx.type === 'win' ? '🏆' : tx.type === 'deposit' ? '💳' : tx.type === 'loss' ? '❌' : tx.type === 'withdraw' ? '📤' : '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{tx.description}</p>
                    <p className="text-white/30 text-xs">{tx.timestamp.toLocaleDateString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.currency}
                    </p>
                    <p className={`text-xs ${tx.status === 'completed' ? 'text-green-400/50' : 'text-yellow-400/50'}`}>
                      {tx.status === 'completed' ? '✓ Complété' : '⏳ En cours'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Deposit / Withdraw Form */}
        {(tab === 'deposit' || tab === 'withdraw') && (
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-5 border border-white/5"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  {tab === 'deposit' ? <ArrowDownLeft size={18} className="text-green-400" /> : <ArrowUpRight size={18} className="text-red-400" />}
                  {tab === 'deposit' ? 'Effectuer un dépôt' : 'Effectuer un retrait'}
                </h3>

                {tab === 'withdraw' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                    <p className="text-blue-300 text-xs">
                      ℹ️ Seul votre solde réel peut être retiré ({balanceCDF.toLocaleString()} FC). Le wallet virtuel n'est pas retirable.
                    </p>
                  </div>
                )}

                {/* Currency selector */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setCurrency('CDF'); setAmount(''); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${currency === 'CDF' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                    🇨🇩 FC (Franc)
                  </button>
                  <button onClick={() => { setCurrency('USD'); setAmount(''); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${currency === 'USD' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                    🇺🇸 USD (Dollar)
                  </button>
                </div>

                {/* Method selection */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {METHODS.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${method === m.id ? 'border-yellow-500/60 bg-yellow-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-white text-xs font-medium">{m.name}</span>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="relative mb-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`Montant en ${currency}`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">{currency}</span>
                </div>

                {/* Equivalent */}
                {amount && Number(amount) > 0 && (
                  <p className="text-white/30 text-xs mb-3">
                    ≈ {currency === 'CDF'
                      ? `$${(Number(amount) / adminSettings.cdfRate).toFixed(2)} USD`
                      : `${(Number(amount) * adminSettings.cdfRate).toLocaleString()} FC`}
                  </p>
                )}

                {/* Quick amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {quickAmounts.map(a => (
                    <button key={a} onClick={() => setAmount(a.toString())}
                      className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-xs transition-colors hover:text-white hover:border-yellow-500/30">
                      {currency === 'USD' ? `$${a}` : a.toLocaleString()}
                    </button>
                  ))}
                </div>

                {insufficient && (
                  <p className="text-red-400 text-xs mb-3">⚠️ Solde réel insuffisant ({balanceCDF.toLocaleString()} FC disponible)</p>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  disabled={!amount || Number(amount) <= 0 || insufficient}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-yellow-400 hover:to-yellow-500 transition-all">
                  Continuer →
                </motion.button>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl p-6 border border-yellow-500/30 text-center"
              >
                <div className="text-4xl mb-3">{tab === 'deposit' ? '📥' : '📤'}</div>
                <h3 className="text-white font-bold text-lg mb-2">Confirmer {tab === 'deposit' ? 'le dépôt' : 'le retrait'}</h3>
                <div className="bg-white/5 rounded-xl p-4 mb-5">
                  <p className="text-white/50 text-sm">Montant</p>
                  <p className="text-3xl font-bold gradient-gold">{Number(amount).toLocaleString()} {currency}</p>
                  {currency === 'USD' && <p className="text-white/30 text-xs mt-1">≈ {amtCDF.toLocaleString()} FC</p>}
                  <p className="text-white/40 text-sm mt-1">via {METHODS.find(m => m.id === method)?.name}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep('form')} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors">
                    Annuler
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
                    className="flex-1 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Check size={16} /> Confirmer</>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-8 text-center border border-green-500/30"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check size={32} className="text-white" />
                </motion.div>
                <h3 className="text-white font-bold text-xl mb-2">Succès!</h3>
                <p className="text-white/60">{tab === 'deposit' ? 'Dépôt effectué avec succès' : 'Retrait en cours de traitement'}</p>
                <p className="text-green-400 font-bold text-2xl mt-3">{Number(amount).toLocaleString()} {currency}</p>
                <p className="text-white/30 text-xs mt-1">≈ {currency === 'USD' ? amtCDF.toLocaleString() + ' FC' : '$' + (amtCDF / adminSettings.cdfRate).toFixed(2) + ' USD'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
