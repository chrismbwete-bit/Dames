import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Swords, Clock, Grid3x3, Users, Palette, Box,
  Wallet, AlertCircle, CheckCircle, Zap, Crown
} from 'lucide-react';
import { useGameStore, OnlinePlayer, Currency, AIDifficulty } from '../store/gameStore';

const PIECE_COLORS = [
  { name: 'Rouge',  value: '#dc2626' },
  { name: 'Or',     value: '#d97706' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Bleu',   value: '#2563eb' },
  { name: 'Vert',   value: '#16a34a' },
  { name: 'Rose',   value: '#db2777' },
];

const AI_LEVELS: { diff: AIDifficulty; label: string; desc: string; color: string }[] = [
  { diff: 'simple',  label: '🟢 Simple',   desc: 'Mouvements aléatoires', color: 'green' },
  { diff: 'easy',    label: '🔵 Facile',   desc: 'Prend les pièces disponibles', color: 'blue' },
  { diff: 'normal',  label: '🟡 Normal',   desc: 'Stratégie modérée (Minimax 3)', color: 'yellow' },
  { diff: 'hard',    label: '🔴 Difficile',desc: 'Analyse avancée (Minimax 5)', color: 'orange' },
  { diff: 'extreme', label: '💀 Dur',       desc: 'Niveau maître (Minimax 7)', color: 'red' },
];

function lighten(hex: string): string {
  try {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgb(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)})`;
  } catch { return hex; }
}

export default function ChallengeSetup() {
  const {
    onlinePlayers, setCurrentView, initGame,
    currentUser, sendChallenge, adminSettings,
    setAIDifficulty, loadOnlinePlayers,
  } = useGameStore();

  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);
  const [betAmount, setBetAmount]   = useState(5000);
  const [currency, setCurrency]     = useState<Currency>(adminSettings.defaultCurrency);
  const [pieceCount, setPieceCount] = useState(12);
  const [boardSize, setBoardSize]   = useState(10);
  const [timePerTurn, setTimePerTurn] = useState(60);
  const [playerColor, setPlayerColor]   = useState('#dc2626');
  const [opponentColor, setOpponentColor] = useState('#1f2937');
  const [is3D, setIs3D]             = useState(false);
  const [tab, setTab]               = useState<'online' | 'ai'>('online');
  const [selectedDiff, setSelectedDiff] = useState<AIDifficulty>('normal');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [sending, setSending]       = useState(false);
  const [useVirtual, setUseVirtual] = useState(false);

  useEffect(() => { loadOnlinePlayers(); }, [loadOnlinePlayers]);

  // Joueurs en ligne sauf soi-même
  const onlinePl = onlinePlayers.filter(
    p => p.isOnline && p.id !== currentUser?.id
  );

  const quickAmountsCDF = [500, 1000, 5000, 10000, 50000, 100000];
  const quickAmountsUSD = [1, 5, 10, 25, 50, 100];

  // Calculs de solde
  const amtCDF = currency === 'CDF' ? betAmount : betAmount * adminSettings.cdfRate;
  const realBalance   = currentUser?.balance ?? 0;
  const virtualCDF    = currentUser?.virtualBalanceCDF ?? 0;
  const hasRealFunds  = realBalance >= amtCDF;
  const hasVirtualFunds = virtualCDF >= amtCDF;
  const hasFunds      = useVirtual ? hasVirtualFunds : hasRealFunds;

  // ── Lancer un défi en ligne ──────────────────────────────────────────────
  const startOnlineChallenge = async () => {
    setError('');
    if (!selectedPlayer) { setError('Veuillez sélectionner un adversaire.'); return; }
    if (!currentUser)    { setError('Vous devez être connecté.'); return; }
    if (betAmount <= 0)  { setError('La mise doit être supérieure à 0.'); return; }
    if (!hasFunds) {
      setError(useVirtual
        ? `Wallet virtuel insuffisant. Disponible: ${virtualCDF.toLocaleString()} CDF`
        : `Solde réel insuffisant. Disponible: ${realBalance.toLocaleString()} CDF`
      );
      return;
    }

    setSending(true);
    try {
      await sendChallenge(
        selectedPlayer, betAmount, currency,
        pieceCount, boardSize, timePerTurn,
        useVirtual,
        playerColor, opponentColor, is3D,
      );
      setSuccess(`Défi envoyé à ${selectedPlayer.name}! La partie démarre...`);
      // L'émetteur joue 'black' (rouge commence = l'acceptant joue en premier)
      // L'émetteur est avantagé car il a configuré la partie
      setTimeout(() => {
        initGame('challenge', {
          betAmount: amtCDF,
          currency,
          pieceCount,
          boardSize,
          timePerTurn,
          opponentName: selectedPlayer.name,
          playerColor: 'black',  // ← L'émetteur contrôle les pions NOIRS
          playerPieceColor: playerColor,
          opponentPieceColor: opponentColor,
          is3D,
          useVirtual,
        });
      }, 1500);
    } catch {
      setError('Erreur lors de l\'envoi du défi. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  // ── Lancer une partie vs IA ──────────────────────────────────────────────
  const startAI = () => {
    setError('');
    setAIDifficulty(selectedDiff);
    initGame('ai', {
      betAmount: 0,
      pieceCount,
      boardSize,
      timePerTurn: adminSettings.aiMatchTime,
      playerPieceColor: playerColor,
      opponentPieceColor: opponentColor,
      is3D,
      aiDiff: selectedDiff,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 bg-black/60 backdrop-blur border-b border-white/5 flex items-center gap-3">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white font-orbitron">Configuration du Défi</h1>
          <p className="text-white/40 text-xs">Choisissez vos paramètres de jeu</p>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Tabs Mode ── */}
        <div className="flex gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/5">
          {(['online','ai'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                tab === t
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              {t === 'online' ? <><Users size={16}/> En ligne</> : <><Zap size={16}/> vs IA</>}
            </button>
          ))}
        </div>

        {/* ── Erreur / Succès ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5"/>
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5"/>
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Niveau IA ── */}
        {tab === 'ai' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Crown size={16} className="text-yellow-400"/> Niveau d'intelligence
            </h3>
            <div className="space-y-2">
              {AI_LEVELS.map(({ diff, label, desc }) => (
                <button key={diff} onClick={() => setSelectedDiff(diff)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedDiff === diff
                      ? 'border-yellow-500/60 bg-yellow-500/10 shadow-inner'
                      : 'border-white/8 bg-white/3 hover:bg-white/8'
                  }`}>
                  <span className="text-white font-semibold text-sm">{label}</span>
                  <span className="text-white/40 text-xs">{desc}</span>
                  {selectedDiff === diff && (
                    <CheckCircle size={14} className="text-yellow-400 ml-2 shrink-0"/>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Sélection adversaire (En ligne) ── */}
        {tab === 'online' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Users size={16} className="text-yellow-400"/>
              Choisir un adversaire
              <span className="ml-auto text-xs text-green-400 font-normal">
                {onlinePl.length} en ligne
              </span>
            </h3>

            {onlinePl.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-white/10 mb-2"/>
                <p className="text-white/30 text-sm">Aucun joueur en ligne pour l'instant</p>
                <button onClick={loadOnlinePlayers}
                  className="mt-2 text-yellow-400 text-xs hover:underline">
                  Actualiser
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {onlinePl.map(player => (
                  <button key={player.id} onClick={() => setSelectedPlayer(player)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      selectedPlayer?.id === player.id
                        ? 'bg-yellow-500/20 border-yellow-500/50 shadow-inner'
                        : 'bg-white/3 border-white/5 hover:bg-white/8'
                    }`}>
                    <span className="text-2xl">{player.avatar}</span>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold text-sm">{player.name}</p>
                      <p className="text-white/40 text-xs">
                        {player.wins} victoires • Gains: {player.earnings.toLocaleString()} CDF
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30">#{player.rank}</span>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Mise (En ligne uniquement) ── */}
        {tab === 'online' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="glass rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Wallet size={16} className="text-green-400"/> Mise du défi
            </h3>

            {/* Type de wallet */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setUseVirtual(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  !useVirtual
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/8'
                }`}>
                💳 Solde réel
                <div className="text-[10px] font-normal opacity-70 mt-0.5">
                  {realBalance.toLocaleString()} CDF
                </div>
              </button>
              <button onClick={() => setUseVirtual(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  useVirtual
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/8'
                }`}>
                🎮 Virtuel (démo)
                <div className="text-[10px] font-normal opacity-70 mt-0.5">
                  {virtualCDF.toLocaleString()} CDF
                </div>
              </button>
            </div>

            {useVirtual && (
              <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-purple-300 text-xs">
                  ⚠️ Argent virtuel — les gains ne sont pas réels et ne peuvent pas être retirés.
                </p>
              </div>
            )}

            {/* Devise */}
            <div className="flex gap-2 mb-3">
              {(['CDF','USD'] as Currency[]).map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                    currency === c
                      ? c === 'CDF'
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/8'
                  }`}>
                  {c === 'CDF' ? '🇨🇩 CDF' : '🇺🇸 USD'}
                </button>
              ))}
            </div>

            {/* Montant */}
            <div className="relative mb-3">
              <input
                type="number"
                value={betAmount}
                min={adminSettings.minBet}
                max={adminSettings.maxBet}
                onChange={e => { setBetAmount(Number(e.target.value)); setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-yellow-500/50 transition-colors pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">{currency}</span>
            </div>

            {/* Montants rapides */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(currency === 'CDF' ? quickAmountsCDF : quickAmountsUSD).map(a => (
                <button key={a} onClick={() => setBetAmount(a)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    betAmount === a
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                      : 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10'
                  }`}>
                  {currency === 'USD' ? `$${a}` : `${a >= 1000 ? `${a/1000}k` : a}`}
                </button>
              ))}
            </div>

            {/* Solde info */}
            <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
              hasFunds
                ? 'bg-green-500/5 border-green-500/20 text-green-400'
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              {hasFunds
                ? <CheckCircle size={13}/>
                : <AlertCircle size={13}/>
              }
              {hasFunds
                ? `✓ Fonds suffisants — Disponible: ${(useVirtual ? virtualCDF : realBalance).toLocaleString()} CDF`
                : `✗ Fonds insuffisants — Disponible: ${(useVirtual ? virtualCDF : realBalance).toLocaleString()} CDF`
              }
            </div>

            {/* Frais de plateforme */}
            <div className="mt-2 text-xs text-white/30 text-center">
              Frais plateforme: {adminSettings.platformFee}% • Gain net: {
                (betAmount * 2 * (1 - adminSettings.platformFee/100)).toLocaleString()
              } {currency}
            </div>
          </motion.div>
        )}

        {/* ── Configuration du plateau ── */}
        <div className="glass rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Grid3x3 size={16} className="text-blue-400"/> Configuration du plateau
          </h3>

          {/* Taille */}
          <div className="mb-4">
            <p className="text-white/50 text-sm mb-2">Taille du plateau</p>
            <div className="flex gap-2">
              {[8, 10, 12].map(s => (
                <button key={s} onClick={() => setBoardSize(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    boardSize === s
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10'
                  }`}>
                  {s}×{s}
                </button>
              ))}
            </div>
          </div>

          {/* Pions */}
          <div className="mb-4">
            <p className="text-white/50 text-sm mb-2">
              Pions par joueur: <span className="text-white font-bold">{pieceCount}</span>
            </p>
            <input type="range" min={6} max={24} value={pieceCount}
              onChange={e => setPieceCount(Number(e.target.value))}
              className="w-full accent-yellow-500"/>
            <div className="flex justify-between text-white/20 text-xs mt-1">
              <span>6</span><span>12</span><span>20</span><span>24</span>
            </div>
          </div>

          {/* Temps (seulement en ligne — l'IA utilise le réglage admin) */}
          {tab === 'online' && (
            <div>
              <p className="text-white/50 text-sm mb-2 flex items-center gap-1">
                <Clock size={13}/> Temps par tour:
                <span className="text-white font-bold ml-1">{timePerTurn}s</span>
              </p>
              <div className="flex gap-2">
                {[15,30,60,120,300].map(t => (
                  <button key={t} onClick={() => setTimePerTurn(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      timePerTurn === t
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                        : 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10'
                    }`}>
                    {t < 60 ? `${t}s` : `${t/60}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-xs text-center">
                ⏱ Temps IA: {adminSettings.aiMatchTime}s/tour (réglé par l'admin)
              </p>
            </div>
          )}
        </div>

        {/* ── Couleurs des pions ── */}
        <div className="glass rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Palette size={16} className="text-pink-400"/> Couleurs des pions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Vos pions', val: playerColor, set: setPlayerColor },
              { label: tab==='ai' ? 'Pions IA' : 'Pions adversaire', val: opponentColor, set: setOpponentColor },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <p className="text-white/50 text-xs mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {PIECE_COLORS.map(c => (
                    <button key={c.value} onClick={() => set(c.value)} title={c.name}
                      className={`w-9 h-9 rounded-full transition-all shadow-md ${
                        val === c.value ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: `radial-gradient(circle at 35% 35%, ${lighten(c.value)}, ${c.value})` }}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Prévisualisation */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full shadow-xl"
                style={{ background: `radial-gradient(circle at 35% 35%, ${lighten(playerColor)}, ${playerColor})` }}/>
              <span className="text-white/50 text-xs">Vous</span>
            </div>
            <span className="text-white/20 font-bold text-lg">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">{tab === 'ai' ? 'IA' : 'Adv.'}</span>
              <div className="w-10 h-10 rounded-full shadow-xl"
                style={{ background: `radial-gradient(circle at 35% 35%, ${lighten(opponentColor)}, ${opponentColor})` }}/>
            </div>
          </div>
        </div>

        {/* ── Mode 3D ── */}
        <div className="glass rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                <Box size={16} className="text-purple-400"/>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Visualisation 3D</p>
                <p className="text-white/30 text-xs">Perspective 3D avec animations de mouvement</p>
              </div>
            </div>
            <button onClick={() => setIs3D(!is3D)}
              className={`w-13 h-7 rounded-full transition-all relative p-0.5 ${is3D ? 'bg-purple-500' : 'bg-white/10'}`}>
              <div className={`w-6 h-6 bg-white rounded-full transition-all ${is3D ? 'translate-x-6' : 'translate-x-0'}`}/>
            </button>
          </div>
        </div>

        {/* ── Résumé du défi (online) ── */}
        {tab === 'online' && selectedPlayer && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            className="glass rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5">
            <h3 className="text-yellow-400 font-bold mb-3 text-sm">📋 Résumé du défi</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Adversaire</span>
                <span className="text-white font-semibold">{selectedPlayer.avatar} {selectedPlayer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Mise</span>
                <span className="text-yellow-400 font-bold">{betAmount.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Gain potentiel</span>
                <span className="text-green-400 font-bold">
                  {(betAmount * 2 * (1 - adminSettings.platformFee/100)).toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Frais ({adminSettings.platformFee}%)</span>
                <span className="text-white/40">{(betAmount * adminSettings.platformFee/100 * 2).toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Plateau</span>
                <span className="text-white">{boardSize}×{boardSize} • {pieceCount} pions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Temps/tour</span>
                <span className="text-white">{timePerTurn}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Wallet utilisé</span>
                <span className={useVirtual ? 'text-purple-400' : 'text-green-400'}>
                  {useVirtual ? '🎮 Virtuel' : '💳 Réel'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Bouton lancer ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={tab === 'online' ? startOnlineChallenge : startAI}
          disabled={sending || (tab === 'online' && (!selectedPlayer || !hasFunds))}
          className={`w-full py-4 font-bold rounded-2xl text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'online'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 shadow-yellow-500/30'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-purple-500/30'
          } disabled:opacity-40 disabled:cursor-not-allowed`}>
          {sending ? (
            <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"/> Envoi en cours...</>
          ) : tab === 'online' ? (
            <><Swords size={20}/> {selectedPlayer ? `Défier ${selectedPlayer.name}!` : 'Sélectionner un adversaire'}</>
          ) : (
            <><Zap size={20}/> Jouer vs IA — {AI_LEVELS.find(l=>l.diff===selectedDiff)?.label}</>
          )}
        </motion.button>

        {/* Aide */}
        <div className="text-center">
          <p className="text-white/20 text-xs">
            {tab === 'online'
              ? '⚔️ Règles africaines • Capture obligatoire • Roi couloir diagonal illimité'
              : '🤖 L\'IA apprend et s\'adapte à votre niveau de jeu'}
          </p>
        </div>

      </div>
    </div>
  );
}
