import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Trophy, Target, Wallet, MessageCircle,
  Settings, Check, Swords, X, Clock, ChevronRight
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const iconMap: Record<string, React.ElementType> = {
  challenge: Swords,
  win:       Trophy,
  loss:      Target,
  deposit:   Wallet,
  withdraw:  Wallet,
  chat:      MessageCircle,
  system:    Settings,
};

const colorMap: Record<string, string> = {
  challenge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  win:       'text-green-400  bg-green-500/10  border-green-500/30',
  loss:      'text-red-400    bg-red-500/10    border-red-500/30',
  deposit:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  withdraw:  'text-blue-400   bg-blue-500/10   border-blue-500/30',
  chat:      'text-purple-400 bg-purple-500/10 border-purple-500/30',
  system:    'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

export default function NotificationsView() {
  const {
    notifications, markNotificationsRead,
    acceptChallenge, declineChallenge,
    challenges, loadChallenges, currentUser,
  } = useGameStore();

  useEffect(() => {
    if (currentUser) loadChallenges();
  }, [currentUser, loadChallenges]);

  const unread = notifications.filter(n => !n.read).length;

  // Défis en attente reçus par l'utilisateur courant
  const pendingChallenges = challenges.filter(
    c => c.toPlayerId === currentUser?.id && c.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-orbitron">Notifications</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {unread > 0
                ? `${unread} non lue${unread > 1 ? 's' : ''}`
                : 'Tout est lu'
              }
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markNotificationsRead}
              className="flex items-center gap-1.5 text-yellow-400 text-sm hover:text-yellow-300 transition-colors px-3 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20"
            >
              <Check size={14}/> Tout lu
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Défis en attente (section dédiée) ── */}
        <AnimatePresence>
          {pendingChallenges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
                <Swords size={16} className="text-yellow-400"/>
                <span className="text-yellow-400 font-bold text-sm">
                  Défis en attente ({pendingChallenges.length})
                </span>
                <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
              </div>

              <div className="divide-y divide-white/5">
                {pendingChallenges.map(challenge => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4"
                  >
                    {/* Infos du défi */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
                        <Swords size={18} className="text-yellow-400"/>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">
                          ⚔️ Défi de {challenge.fromPlayer}
                        </p>
                        <p className="text-yellow-400 font-bold text-base mt-0.5">
                          Mise: {challenge.betAmount.toLocaleString()} {challenge.currency}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white/50">
                            {challenge.boardSize}×{challenge.boardSize}
                          </span>
                          <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white/50">
                            {challenge.pieceCount} pions
                          </span>
                          <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white/50 flex items-center gap-1">
                            <Clock size={10}/> {challenge.timePerTurn}s/tour
                          </span>
                          <span className="text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-0.5 text-green-400">
                            Gain: {(challenge.betAmount * 2 * 0.98).toLocaleString()} {challenge.currency}
                          </span>
                        </div>
                        <p className="text-white/30 text-xs mt-1">
                          {getRelativeTime(challenge.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Boutons Accepter / Refuser */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => declineChallenge(challenge.id)}
                        className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-sm font-semibold hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30 flex items-center justify-center gap-1.5"
                      >
                        <X size={14}/> Refuser
                      </button>
                      <button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl text-sm font-bold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-md shadow-yellow-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Swords size={14}/> Accepter!
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Historique des notifications ── */}
        {notifications.length === 0 && pendingChallenges.length === 0 && (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-white/10 mb-4"/>
            <p className="text-white/30 text-lg font-semibold">Aucune notification</p>
            <p className="text-white/20 text-sm mt-1">Vos activités apparaîtront ici</p>
          </div>
        )}

        <AnimatePresence>
          {notifications.map((notif, i) => {
            const Icon = iconMap[notif.type] || Bell;
            const colorClass = colorMap[notif.type] || colorMap.system;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`glass rounded-2xl p-4 border transition-all ${
                  notif.read
                    ? 'border-white/5 opacity-60'
                    : 'border-white/10 shadow-sm'
                } relative overflow-hidden`}
              >
                {/* Indicateur non-lu */}
                {!notif.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 rounded-l-2xl"/>
                )}

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={17}/>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-semibold text-sm leading-snug">{notif.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.read && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
                        )}
                        <p className="text-white/30 text-xs">{getRelativeTime(notif.timestamp)}</p>
                      </div>
                    </div>

                    <p className="text-white/50 text-sm mt-0.5 leading-relaxed">{notif.message}</p>

                    {notif.amount && (
                      <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-sm font-bold ${
                        notif.type === 'win' || notif.type === 'deposit'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {notif.type === 'win' || notif.type === 'deposit' ? '+' : '-'}
                        {notif.amount.toLocaleString()} CDF
                      </div>
                    )}

                    {/* Lien vers la partie si matchId */}
                    {notif.matchId && notif.type === 'challenge' && (
                      <button className="mt-2 flex items-center gap-1 text-yellow-400 text-xs hover:text-yellow-300 transition-colors">
                        <ChevronRight size={12}/> Voir le défi
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Fin de liste */}
        {notifications.length > 0 && (
          <div className="text-center py-4">
            <p className="text-white/20 text-xs">— Fin des notifications —</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'maintenant';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}j`;
}
