import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const QUICK_MESSAGES = [
  { label: '👏', msg: 'Bien joué! 👏' },
  { label: '😂', msg: '😂😂😂' },
  { label: '🔥', msg: '🔥🔥🔥' },
  { label: '💪', msg: 'Je vais gagner! 💪' },
  { label: '😈', msg: 'Attention à toi! 😈' },
  { label: '🤝', msg: 'Bonne partie! 🤝' },
  { label: 'GG!', msg: 'GG! Bien joué!' },
  { label: 'Gg wp', msg: 'Gg wp — beau match!' },
];

export default function ChatPanel() {
  const {
    chatMessages, addChatMessage, toggleChat,
    currentUser, gameState,
  } = useGameStore();

  const [input, setInput]               = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input à l'ouverture
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Simuler "l'adversaire est en train d'écrire..." après envoi
  const simulateOpponentTyping = () => {
    if (gameState?.mode === 'ai') return;
    if (Math.random() < 0.5) {
      setTimeout(() => {
        setIsTyping(true);
        const t = setTimeout(() => setIsTyping(false), 2000 + Math.random() * 2000);
        setTypingTimeout(t);
      }, 800 + Math.random() * 1500);
    }
  };

  useEffect(() => {
    return () => { if (typingTimeout) clearTimeout(typingTimeout); };
  }, [typingTimeout]);

  const send = () => {
    if (!input.trim()) return;
    addChatMessage(input.trim());
    simulateOpponentTyping();
    setInput('');
    inputRef.current?.focus();
  };

  const sendQuick = (msg: string) => {
    addChatMessage(msg);
    simulateOpponentTyping();
  };

  const myId = currentUser?.id || 'me';
  const mode = gameState?.mode;
  const isOnline = mode === 'online' || mode === 'challenge';

  // Grouper les messages par expéditeur consécutif
  const grouped = chatMessages.reduce((acc: typeof chatMessages[], msg, i) => {
    const prev = chatMessages[i - 1];
    if (prev && prev.senderId === msg.senderId) {
      acc[acc.length - 1] = [...acc[acc.length - 1], msg];
    } else {
      acc.push([msg]);
    }
    return acc;
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 glass-dark border-l border-white/10 flex flex-col z-40 shadow-2xl shadow-black/50"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle size={18} className="text-yellow-400" />
            {isOnline && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <span className="font-semibold text-white">Chat en Direct</span>
          <span className="text-white/40 text-xs">— {gameState?.opponentName || 'Adversaire'}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicateur connexion */}
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-400/70 text-xs">
              <Wifi size={11} />
              <span>En ligne</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-white/30 text-xs">
              <WifiOff size={11} />
              <span>vs IA</span>
            </div>
          )}
          <button
            onClick={toggleChat}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages rapides ──────────────────────────────── */}
      <div className="flex gap-1.5 p-2.5 border-b border-white/5 overflow-x-auto bg-black/10">
        {QUICK_MESSAGES.map((q, i) => (
          <button
            key={i}
            onClick={() => sendQuick(q.msg)}
            title={q.msg}
            className="shrink-0 px-2.5 py-1.5 bg-white/5 hover:bg-yellow-500/15 hover:border-yellow-500/30 border border-white/8 rounded-xl text-sm transition-all hover:text-yellow-300 text-white/70"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* ── Messages ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {chatMessages.length === 0 && (
          <div className="text-center text-white/30 text-sm mt-12">
            <MessageCircle size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">Aucun message</p>
            <p className="text-xs mt-1 text-white/20">
              {isOnline
                ? 'Discutez avec votre adversaire!'
                : 'Le chat est actif — envoyez un message!'
              }
            </p>
          </div>
        )}

        {/* Messages groupés */}
        {grouped.map((group, gi) => {
          const isMe = group[0].senderId === myId;
          return (
            <div key={gi} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
              {/* Nom expéditeur */}
              <span className="text-white/30 text-xs mb-1 px-1">{group[0].senderName}</span>

              {/* Bulles de messages */}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-0.5`}>
                {group.map((msg, mi) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, delay: mi * 0.05 }}
                    className={`max-w-[85%] px-3 py-2 text-sm text-white ${
                      isMe ? 'chat-bubble-own' : 'chat-bubble-other'
                    }`}
                  >
                    {msg.content}
                  </motion.div>
                ))}
              </div>

              {/* Heure du dernier message du groupe */}
              <span className="text-white/20 text-xs mt-0.5 px-1">
                {group[group.length - 1].timestamp.toLocaleTimeString('fr', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}

        {/* Indicateur "en train d'écrire..." */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-start gap-2"
            >
              <span className="text-white/30 text-xs px-1">
                {gameState?.opponentName || 'Adversaire'}
              </span>
              <div className="chat-bubble-other px-3 py-2 flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Zone de saisie ────────────────────────────────── */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        {/* Info temps réel */}
        {isOnline && (
          <div className="flex items-center gap-1.5 text-xs text-white/25 mb-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span>Chat en temps réel — l'adversaire voit vos messages</span>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Votre message..."
            maxLength={200}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-yellow-500/40 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            disabled={!input.trim()}
            className="p-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-black transition-colors shadow-lg shadow-yellow-500/20"
          >
            <Send size={16} />
          </motion.button>
        </div>
        {input.length > 150 && (
          <p className="text-white/30 text-xs mt-1 text-right">{200 - input.length} caractères restants</p>
        )}
      </div>
    </motion.div>
  );
}
