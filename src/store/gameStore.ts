import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  PlayerService, MatchService, TransactionService,
  NotificationService, ChallengeService, ChatService, AdminService,
  AdminWalletService,
  hashPassword, verifyPassword, initializeDatabase,
  type PlayerData, type TransactionData, type NotificationData,
  type ChallengeData,
} from '../lib/database';

// Codes d'erreur d'inscription
export type RegisterError = 'email_taken' | 'phone_taken' | 'unknown' | null;

// ─── Types ────────────────────────────────────────────────────────────────────
export type PieceColor = 'red' | 'black';
export type GameMode = 'ai' | 'online' | 'challenge';
export type AppView = 'home' | 'game' | 'dashboard' | 'wallet' | 'notifications' | 'admin' | 'auth' | 'challenge-setup';
export type AIDifficulty = 'simple' | 'easy' | 'normal' | 'hard' | 'extreme';
export type Currency = 'CDF' | 'USD';

// Wallet virtuel : donné à la création de compte, non retirable, pour tests/démos
export const VIRTUAL_WALLET_CDF = 54000;
export const VIRTUAL_WALLET_USD = 200;

export interface Piece {
  id: string;
  color: PieceColor;
  isKing: boolean;
  row: number;
  col: number;
}

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  capturedPieces?: { row: number; col: number }[];
}

export interface Player {
  id: string;
  name: string;
  firstName: string;
  phone: string;
  email: string;
  password: string;
  balance: number;
  virtualBalanceCDF: number;  // Wallet virtuel CDF — non retirable
  virtualBalanceUSD: number;  // Wallet virtuel USD — non retirable
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalEarnings: number;
  avatar: string;
  isOnline: boolean;
  preferredCurrency: Currency;
  role: 'player' | 'admin';
}

export interface GameState {
  pieces: Piece[];
  currentTurn: PieceColor;
  selectedPiece: Piece | null;
  validMoves: Move[];
  gameOver: boolean;
  winner: PieceColor | 'draw' | null;
  mode: GameMode;
  drawCount: number;
  matchId: string;
  betAmount: number;
  currency: Currency;
  timePerTurn: number;
  playerTimeLeft: number;
  opponentTimeLeft: number;
  boardSize: number;
  pieceCount: number;
  playerColor: PieceColor;
  opponentName: string;
  capturedRed: number;
  capturedBlack: number;
  is3D: boolean;
  playerPieceColor: string;
  opponentPieceColor: string;
  moveHistory: Move[];
  consecutiveDraws: number;
  aiDifficulty: AIDifficulty;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: 'challenge' | 'win' | 'loss' | 'deposit' | 'withdraw' | 'chat' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  fromPlayer?: string;
  amount?: number;
  matchId?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'loss' | 'fee';
  amount: number;
  currency: Currency;
  timestamp: Date;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Challenge {
  id: string;
  fromPlayer: string;
  fromPlayerId: string;
  toPlayerId: string;
  betAmount: number;
  currency: Currency;
  pieceCount: number;
  boardSize: number;
  timePerTurn: number;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: Date;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  wins: number;
  isOnline: boolean;
  avatar: string;
  rank: number;
  earnings: number;
}

interface AppStore {
  currentUser: Player | null;
  isAuthenticated: boolean;
  authMode: 'login' | 'register' | 'forgot';
  currentView: AppView;
  previousView: AppView | null;
  logoClickCount: number;
  gameState: GameState | null;
  aiDifficulty: AIDifficulty;
  chatMessages: ChatMessage[];
  unreadMessages: number;
  chatOpen: boolean;
  notifications: Notification[];
  transactions: Transaction[];
  challenges: Challenge[];
  onlinePlayers: OnlinePlayer[];
  leaderboard: OnlinePlayer[];
  dbLoading: boolean;
  adminSettings: {
    aiMatchTime: number;
    challengeMatchTime: number;
    platformFee: number;
    maxBet: number;
    minBet: number;
    cdfRate: number;
    usdRate: number;
    defaultCurrency: Currency;
  };

  // Auth & Navigation
  setAuthMode: (mode: 'login' | 'register' | 'forgot') => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Partial<Player> & { password: string }) => Promise<RegisterError>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  setCurrentView: (view: AppView) => void;
  handleLogoClick: () => void;

  // Wallet
  useVirtualBalance: (amount: number, currency: Currency) => Promise<boolean>;
  hasEnoughFunds: (amount: number, currency: Currency, useVirtual?: boolean) => boolean;
  deposit: (amount: number, method: string, currency: Currency) => Promise<void>;
  withdraw: (amount: number, method: string, currency: Currency) => Promise<void>;
  updateBalance: (amount: number, type: Transaction['type'], description: string, currency?: Currency) => Promise<void>;
  loadTransactions: () => Promise<void>;

  // Game
  initGame: (mode: GameMode, options?: any) => void;
  selectPiece: (piece: Piece) => void;
  makeMove: (move: Move) => Promise<void>;
  aiMove: () => void;
  syncFromServer: (matchData: any) => void;
  abandonGame: () => void;

  // Chat & Social
  addChatMessage: (content: string) => void;
  pollChatMessages: () => Promise<void>;
  toggleChat: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  loadNotifications: () => Promise<void>;
  loadChallenges: () => Promise<void>;
  loadOnlinePlayers: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;

  // Admin & Utils
  updateAdminSettings: (settings: Partial<AppStore['adminSettings']>) => Promise<void>;
  loadAdminSettings: () => Promise<void>;
  initDB: () => Promise<void>;
  decrementTimer: () => void;
}

  // Game
  abandonGame: () => void;

  // Utils
  decrementTimer: () => void;
  setAIDifficulty: (diff: AIDifficulty) => void;
  convertAmount: (amount: number, from: Currency, to: Currency) => number;
  initDB: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbPlayerToStore(p: PlayerData): Player {
  return {
    id: p.id,
    name: p.lastName,
    firstName: p.firstName,
    phone: p.phone,
    email: p.email,
    password: '',
    balance: p.balance,
    virtualBalanceCDF: p.virtualBalanceCDF ?? VIRTUAL_WALLET_CDF,
    virtualBalanceUSD: p.virtualBalanceUSD ?? VIRTUAL_WALLET_USD,
    totalWins: p.totalWins,
    totalLosses: p.totalLosses,
    totalDraws: p.totalDraws,
    totalEarnings: p.totalEarnings,
    avatar: p.avatar,
    isOnline: p.isOnline,
    preferredCurrency: p.preferredCurrency,
    role: p.role,
  };
}

function dbTransactionToStore(t: TransactionData): Transaction {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    timestamp: new Date(t.createdAt),
    description: t.description,
    status: t.status,
  };
}

function dbNotificationToStore(n: NotificationData): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    read: n.read,
    fromPlayer: n.fromPlayer || undefined,
    amount: n.amount || undefined,
    matchId: n.matchId || undefined,
  };
}

function dbChallengeToStore(c: ChallengeData): Challenge {
  return {
    id: c.id,
    fromPlayer: c.fromPlayerName,
    fromPlayerId: c.fromPlayerId,
    toPlayerId: c.toPlayerId,
    betAmount: c.betAmount,
    currency: c.currency,
    pieceCount: c.pieceCount,
    boardSize: c.boardSize,
    timePerTurn: c.timePerTurn,
    status: c.status,
    timestamp: new Date(c.createdAt),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  AFRICAN CHECKERS LOGIC
// ══════════════════════════════════════════════════════════════════════════════

function initPieces(boardSize: number = 10, pieceCount?: number): Piece[] {
  const pieces: Piece[] = [];
  const rows = boardSize;
  const piecesPerSide = pieceCount || (boardSize === 10 ? 20 : boardSize === 8 ? 12 : 9);
  let redCount = 0;
  let blackCount = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < rows; col++) {
      if ((row + col) % 2 === 1) {
        if (row < rows / 2 - 1 && redCount < piecesPerSide) {
          pieces.push({ id: uuidv4(), color: 'red', isKing: false, row, col });
          redCount++;
        } else if (row > rows / 2 && blackCount < piecesPerSide) {
          pieces.push({ id: uuidv4(), color: 'black', isKing: false, row, col });
          blackCount++;
        }
      }
    }
  }
  return pieces;
}

/** KING: flying king — can slide AND capture along any diagonal corridor */
function getKingMoves(piece: Piece, allPieces: Piece[], boardSize: number): Move[] {
  const moves: Move[] = [];
  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr,dc] of dirs) {
    let r = piece.row + dr, c = piece.col + dc;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const occ = allPieces.find(p => p.row === r && p.col === c);
      if (!occ) { moves.push({ fromRow: piece.row, fromCol: piece.col, toRow: r, toCol: c }); r+=dr; c+=dc; }
      else break;
    }
  }
  return moves;
}

function getKingCaptures(piece: Piece, allPieces: Piece[], boardSize: number, alreadyCaptured: {row:number;col:number}[]): Move[] {
  const captures: Move[] = [];
  const opponent: PieceColor = piece.color === 'red' ? 'black' : 'red';
  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr,dc] of dirs) {
    let r = piece.row + dr, c = piece.col + dc;
    let foundEnemy: Piece | null = null;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const occ = allPieces.find(p => p.row === r && p.col === c);
      if (!foundEnemy) {
        if (!occ) { r+=dr; c+=dc; continue; }
        const already = alreadyCaptured.find(cc => cc.row === r && cc.col === c);
        if (occ.color === opponent && !already) { foundEnemy = occ; r+=dr; c+=dc; continue; }
        else break;
      } else {
        if (!occ) {
          const newCap = [...alreadyCaptured, { row: foundEnemy.row, col: foundEnemy.col }];
          captures.push({ fromRow: piece.row, fromCol: piece.col, toRow: r, toCol: c, capturedPieces: newCap });
          const chains = getKingCaptures({ ...piece, row: r, col: c }, allPieces, boardSize, newCap);
          for (const ch of chains) {
            captures.push({ fromRow: piece.row, fromCol: piece.col, toRow: ch.toRow, toCol: ch.toCol, capturedPieces: ch.capturedPieces });
          }
          r+=dr; c+=dc;
        } else break;
      }
    }
  }
  return captures;
}

// ──────────────────────────────────────────────────────────────────────────────
// RÈGLE DU RETOUR EN ARRIÈRE (African Checkers)
// ✅ Retour arrière AUTORISÉ : uniquement si le pion MANGE un adversaire en reculant
// ❌ Retour arrière INTERDIT : simple déplacement sans capture → bloqué
// ──────────────────────────────────────────────────────────────────────────────

function getNormalCaptures(piece: Piece, allPieces: Piece[], boardSize: number, alreadyCaptured: {row:number;col:number}[]): Move[] {
  const captures: Move[] = [];
  const opponent: PieceColor = piece.color === 'red' ? 'black' : 'red';
  // ✅ Les 4 directions sont vérifiées pour la CAPTURE (y compris retour arrière)
  // Un pion PEUT manger en arrière — règle africaine stricte
  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr,dc] of dirs) {
    const midRow = piece.row + dr, midCol = piece.col + dc;
    const landRow = piece.row + dr*2, landCol = piece.col + dc*2;
    if (landRow >= 0 && landRow < boardSize && landCol >= 0 && landCol < boardSize) {
      const midPiece = allPieces.find(p => p.row === midRow && p.col === midCol && p.color === opponent);
      const landOcc = allPieces.find(p => p.row === landRow && p.col === landCol);
      const already = alreadyCaptured.find(cc => cc.row === midRow && cc.col === midCol);
      if (midPiece && !landOcc && !already) {
        const newCap = [...alreadyCaptured, { row: midRow, col: midCol }];
        captures.push({ fromRow: piece.row, fromCol: piece.col, toRow: landRow, toCol: landCol, capturedPieces: newCap });
        // Chaîne de captures : continue depuis la nouvelle position dans les 4 dirs
        const chains = getNormalCaptures({ ...piece, row: landRow, col: landCol }, allPieces, boardSize, newCap);
        for (const ch of chains) {
          captures.push({ fromRow: piece.row, fromCol: piece.col, toRow: ch.toRow, toCol: ch.toCol, capturedPieces: ch.capturedPieces });
        }
      }
    }
  }
  return captures;
}

function getSimpleMoves(piece: Piece, allPieces: Piece[], boardSize: number): Move[] {
  // ❌ RETOUR ARRIÈRE INTERDIT pour un déplacement simple sans capture
  // Seuls les mouvements en avant sont autorisés pour un pion non-roi sans prise
  const forwardDirs: number[][] = piece.color === 'red' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1]];
  const simpleMoves: Move[] = [];
  for (const [dr,dc] of forwardDirs) {
    const nr = piece.row + dr, nc = piece.col + dc;
    if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
      if (!allPieces.find(p => p.row === nr && p.col === nc)) {
        simpleMoves.push({ fromRow: piece.row, fromCol: piece.col, toRow: nr, toCol: nc });
      }
    }
  }
  return simpleMoves;
}

function getValidMoves(piece: Piece, allPieces: Piece[], boardSize: number = 10): Move[] {
  if (piece.isKing) {
    // Roi : captures en priorité, sinon tous les déplacements libres en diagonale
    const caps = getKingCaptures(piece, allPieces, boardSize, []);
    return caps.length > 0 ? caps : getKingMoves(piece, allPieces, boardSize);
  }
  // Pion normal :
  // 1. Cherche d'abord les captures (toutes directions, y compris arrière) ← OBLIGATOIRE
  const caps = getNormalCaptures(piece, allPieces, boardSize, []);
  if (caps.length > 0) return caps; // Capture obligatoire prioritaire
  // 2. Sinon : uniquement les mouvements simples EN AVANT (retour arrière BLOQUÉ)
  return getSimpleMoves(piece, allPieces, boardSize);
}

function hasMandatoryCapture(pieces: Piece[], color: PieceColor, boardSize: number): boolean {
  return pieces.filter(p => p.color === color).some(p => {
    const moves = getValidMoves(p, pieces, boardSize);
    return moves.some(m => m.capturedPieces && m.capturedPieces.length > 0);
  });
}

function checkGameOver(pieces: Piece[], currentTurn: PieceColor, boardSize: number, consecutiveDraws: number)
  : { over: boolean; winner: PieceColor | 'draw' | null } {
  const red = pieces.filter(p => p.color === 'red');
  const black = pieces.filter(p => p.color === 'black');
  if (red.length === 0) return { over: true, winner: 'black' };
  if (black.length === 0) return { over: true, winner: 'red' };
  const hasMove = pieces.filter(p => p.color === currentTurn).some(p => getValidMoves(p, pieces, boardSize).length > 0);
  if (!hasMove) return { over: true, winner: currentTurn === 'red' ? 'black' : 'red' };
  // 4th draw rule
  if (consecutiveDraws >= 3) {
    if (red.length > black.length) return { over: true, winner: 'red' };
    if (black.length > red.length) return { over: true, winner: 'black' };
    return { over: true, winner: 'draw' };
  }
  return { over: false, winner: null };
}

// ── AI ENGINE ─────────────────────────────────────────────────────────────────

function evaluateBoard(pieces: Piece[], aiColor: PieceColor, boardSize: number): number {
  const opponent: PieceColor = aiColor === 'red' ? 'black' : 'red';
  let score = 0;
  for (const p of pieces) {
    const isAI = p.color === aiColor;
    const sign = isAI ? 1 : -1;
    let val = p.isKing ? 30 : 10;
    if (!p.isKing) {
      const adv = isAI ? (aiColor === 'red' ? p.row : boardSize-1-p.row) : (opponent === 'red' ? p.row : boardSize-1-p.row);
      val += adv * 0.5;
    }
    val += (boardSize/2 - Math.abs(p.col - boardSize/2)) * 0.3;
    score += sign * val;
  }
  return score;
}

function minimax(pieces: Piece[], depth: number, alpha: number, beta: number, isMax: boolean, aiColor: PieceColor, boardSize: number, consecDraws: number): number {
  const opp: PieceColor = aiColor === 'red' ? 'black' : 'red';
  const cur: PieceColor = isMax ? aiColor : opp;
  const { over, winner } = checkGameOver(pieces, cur, boardSize, consecDraws);
  if (over) return winner === aiColor ? 10000+depth : winner === opp ? -10000-depth : 0;
  if (depth === 0) return evaluateBoard(pieces, aiColor, boardSize);
  const allMoves: { piece: Piece; move: Move }[] = [];
  for (const p of pieces.filter(pp => pp.color === cur)) {
    for (const m of getValidMoves(p, pieces, boardSize)) allMoves.push({ piece: p, move: m });
  }
  const capMoves = allMoves.filter(x => x.move.capturedPieces?.length);
  const cands = capMoves.length > 0 ? capMoves : allMoves;
  let best = isMax ? -Infinity : Infinity;
  for (const { move } of cands) {
    let np = pieces.map(p => ({ ...p }));
    if (move.capturedPieces) np = np.filter(p => !move.capturedPieces!.find(c => c.row === p.row && c.col === p.col));
    const mp = np.find(p => p.row === move.fromRow && p.col === move.fromCol);
    if (!mp) continue;
    mp.row = move.toRow; mp.col = move.toCol;
    if (mp.color === 'red' && mp.row === boardSize-1) mp.isKing = true;
    if (mp.color === 'black' && mp.row === 0) mp.isKing = true;
    const val = minimax(np, depth-1, alpha, beta, !isMax, aiColor, boardSize, consecDraws);
    if (isMax) { best = Math.max(best, val); alpha = Math.max(alpha, val); }
    else { best = Math.min(best, val); beta = Math.min(beta, val); }
    if (beta <= alpha) break;
  }
  return best;
}

function getAIMove(pieces: Piece[], aiColor: PieceColor, boardSize: number, difficulty: AIDifficulty, consecDraws: number): Move | null {
  const allMoves: { piece: Piece; move: Move }[] = [];
  for (const p of pieces.filter(pp => pp.color === aiColor)) {
    for (const m of getValidMoves(p, pieces, boardSize)) allMoves.push({ piece: p, move: m });
  }
  if (allMoves.length === 0) return null;
  const capMoves = allMoves.filter(x => x.move.capturedPieces?.length);
  const cands = capMoves.length > 0 ? capMoves : allMoves;
  if (difficulty === 'simple') return cands[Math.floor(Math.random() * cands.length)].move;
  if (difficulty === 'easy') {
    return capMoves.length > 0
      ? capMoves[Math.floor(Math.random() * capMoves.length)].move
      : cands[Math.floor(Math.random() * cands.length)].move;
  }
  const depthMap: Record<AIDifficulty, number> = { simple:1, easy:2, normal:3, hard:5, extreme:7 };
  const noiseMap: Record<AIDifficulty, number> = { simple:0, easy:0, normal:1.5, hard:0.5, extreme:0 };
  const depth = depthMap[difficulty];
  const noise = noiseMap[difficulty];
  let bestScore = -Infinity, bestMove: Move | null = null;
  for (const { move } of cands) {
    let np = pieces.map(p => ({ ...p }));
    if (move.capturedPieces) np = np.filter(p => !move.capturedPieces!.find(c => c.row === p.row && c.col === p.col));
    const mp = np.find(p => p.row === move.fromRow && p.col === move.fromCol);
    if (!mp) continue;
    mp.row = move.toRow; mp.col = move.toCol;
    if (mp.color === 'red' && mp.row === boardSize-1) mp.isKing = true;
    if (mp.color === 'black' && mp.row === 0) mp.isKing = true;
    const score = minimax(np, depth-1, -Infinity, Infinity, false, aiColor, boardSize, consecDraws)
      + (Math.random() - 0.5) * noise;
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove || cands[0].move;
}

// ══════════════════════════════════════════════════════════════════════════════
//  ZUSTAND STORE
// ══════════════════════════════════════════════════════════════════════════════

export const useGameStore = create<AppStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authMode: 'login',
  currentView: 'home',
  previousView: null,
  logoClickCount: 0,
  gameState: null,
  aiDifficulty: 'normal',
  chatMessages: [],
  unreadMessages: 0,
  chatOpen: false,
  notifications: [],
  transactions: [],
  challenges: [],
  onlinePlayers: [],
  leaderboard: [],
  dbLoading: false,
  adminSettings: {
    aiMatchTime: 30,
    challengeMatchTime: 60,
    platformFee: 2,
    maxBet: 500000,
    minBet: 500,
    cdfRate: 2800,
    usdRate: 1,
    defaultCurrency: 'CDF',
  },

  // ── DB Init ────────────────────────────────────────────────────────────────
  initDB: async () => {
    // 1. Init données par défaut + suppression matchs IA résiduels
    initializeDatabase();
    // 2. Nettoyage supplémentaire Supabase des matchs IA (si configuré)
    await MatchService.cleanAIMatches();
    // 3. Chargement config admin
    await get().loadAdminSettings();
    // 4. Chargement classement et joueurs en ligne
    await get().loadLeaderboard();
    await get().loadOnlinePlayers();
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  setAuthMode: (mode) => set({ authMode: mode }),

  login: async (email, password) => {
    set({ dbLoading: true });
    const player = await PlayerService.findByEmail(email);
    set({ dbLoading: false });
    if (!player) return false;
    if (!verifyPassword(password, player.passwordHash)) return false;
    await PlayerService.setOnline(player.id, true);
    const user = dbPlayerToStore(player);
    set({ currentUser: user, isAuthenticated: true, currentView: 'home' });
    await get().loadNotifications();
    await get().loadTransactions();
    await get().loadChallenges();
    return true;
  },

  register: async (data) => {
    set({ dbLoading: true });
    // Vérification email unique
    const emailExists = await PlayerService.findByEmail(data.email || '');
    if (emailExists) { set({ dbLoading: false }); return 'email_taken'; }
    // Vérification téléphone unique
    const phoneExists = await PlayerService.findByPhone(data.phone || '');
    if (phoneExists) { set({ dbLoading: false }); return 'phone_taken'; }

    const player = await PlayerService.create({
      firstName: data.firstName || '',
      lastName: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      passwordHash: hashPassword(data.password || ''),
      balance: 0,
      virtualBalanceCDF: VIRTUAL_WALLET_CDF,
      virtualBalanceUSD: VIRTUAL_WALLET_USD,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      totalEarnings: 0,
      avatar: ['😊','🦁','🐯','🦅','🦊','🐆','👑','⭐'][Math.floor(Math.random() * 8)],
      isOnline: true,
      preferredCurrency: 'CDF',
      role: 'player',
    });
    set({ dbLoading: false });
    if (!player) return 'unknown';
    set({ currentUser: dbPlayerToStore(player), isAuthenticated: true, currentView: 'home' });
    await get().addNotification({
      type: 'deposit',
      title: '🎁 Bienvenue! Wallet virtuel offert',
      message: `Vous recevez 54 000 FC (200$) virtuels pour tester — non retirables. Faites un dépôt pour jouer des défis réels.`,
      amount: VIRTUAL_WALLET_CDF,
    });
    return null; // null = succès
  },

  // ── Wallet Virtuel ────────────────────────────────────────────────────────
  useVirtualBalance: async (amount: number, currency: Currency) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    const amtCDF = currency === 'USD' ? amount * get().adminSettings.cdfRate : amount;
    const amtUSD = currency === 'CDF' ? amount / get().adminSettings.cdfRate : amount;

    if (currency === 'CDF' && currentUser.virtualBalanceCDF < amtCDF) return false;
    if (currency === 'USD' && currentUser.virtualBalanceUSD < amtUSD) return false;

    const updatedUser: Player = {
      ...currentUser,
      virtualBalanceCDF:
  currency === 'CDF'
    ? currentUser.virtualBalanceCDF - amtCDF
    : currentUser.virtualBalanceCDF,

virtualBalanceUSD:
  currency === 'USD'
    ? currentUser.virtualBalanceUSD - amtUSD
    : currentUser.virtualBalanceUSD,
    };
    set({ currentUser: updatedUser });
    await PlayerService.update(currentUser.id, {
      virtualBalanceCDF: updatedUser.virtualBalanceCDF,
      virtualBalanceUSD: updatedUser.virtualBalanceUSD,
    });
    return true;
  },

  hasEnoughFunds: (amount: number, currency: Currency, useVirtual = false) => {
    const { currentUser, adminSettings } = get();
    if (!currentUser) return false;
    const amtCDF = currency === 'USD' ? amount * adminSettings.cdfRate : amount;
    if (useVirtual) {
      return currentUser.virtualBalanceCDF >= amtCDF || currentUser.balance >= amtCDF;
    }
    return currentUser.balance >= amtCDF;
  },

  logout: async () => {
    const { currentUser } = get();
    if (currentUser) await PlayerService.setOnline(currentUser.id, false);
    set({ currentUser: null, isAuthenticated: false, currentView: 'home', logoClickCount: 0, gameState: null });
  },

  forgotPassword: async (email) => {
    return await PlayerService.sendPasswordReset(email);
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  setCurrentView: (view) => set(s => ({ currentView: view, previousView: s.currentView })),

  handleLogoClick: () => {
    const { logoClickCount } = get();
    const n = logoClickCount + 1;
    if (n >= 5) {
      set({ logoClickCount: 0, currentView: 'admin' });
    } else {
      set({ logoClickCount: n });
      setTimeout(() => set(s => ({ logoClickCount: Math.max(0, s.logoClickCount - 1) })), 3000);
    }
  },

  // ── Game ──────────────────────────────────────────────────────────────────
  initGame: (mode, options = {}) => {
    const { adminSettings, aiDifficulty: storeDiff, currentUser } = get();
    const boardSize = options.boardSize || 10;
    const pieces = initPieces(boardSize, options.pieceCount);
    const timePerTurn = options.timePerTurn || (mode === 'ai' ? adminSettings.aiMatchTime : adminSettings.challengeMatchTime);
    const diff: AIDifficulty = options.aiDiff || storeDiff;
    const matchId = uuidv4();
    const useVirtual = options.useVirtual || false;

    // ── Déduction de la mise avant de démarrer (online/challenge uniquement) ──
    if (mode !== 'ai' && options.betAmount && options.betAmount > 0 && currentUser) {
      const amt = options.betAmount;
      const curr = options.currency || adminSettings.defaultCurrency;
      if (useVirtual) {
        // Déduire du wallet virtuel
        const amtCDF = curr === 'USD' ? amt * adminSettings.cdfRate : amt;
        const updatedUser = {
          ...currentUser,
          virtualBalanceCDF: Math.max(0, currentUser.virtualBalanceCDF - amtCDF),
        };
        set({ currentUser: updatedUser });
        PlayerService.update(currentUser.id, { virtualBalanceCDF: updatedUser.virtualBalanceCDF });
      } else {
        // Déduire du solde réel
        const updatedUser = {
          ...currentUser,
          balance: Math.max(0, currentUser.balance - amt),
        };
        set({ currentUser: updatedUser });
        PlayerService.update(currentUser.id, { balance: updatedUser.balance });
      }
    }

    // ── Attribution des couleurs selon le mode et le rôle ──
    // En ligne/défi : l'émetteur joue 'black' (rouge sur le plateau = adversaire)
    //                 l'acceptant joue 'red'   (convention africaine : red commence)
    // En IA : le joueur humain joue toujours 'black', l'IA joue 'red' (red commence)
    const playerColor: PieceColor = options.playerColor || 'black';

    // ⚠️ Ne JAMAIS sauvegarder les matchs IA en base de données
    set({
      gameState: {
        pieces,
        currentTurn: 'red',  // 'red' commence toujours (convention africaine)
        selectedPiece: null,
        validMoves: [],
        gameOver: false,
        winner: null,
        mode,
        drawCount: 0,
        matchId,
        betAmount: options.betAmount || 0,
        currency: options.currency || adminSettings.defaultCurrency,
        timePerTurn,
        playerTimeLeft: timePerTurn,
        opponentTimeLeft: timePerTurn,
        boardSize,
        pieceCount: pieces.filter(p => p.color === 'red').length,
        playerColor,  // couleur assignée à CE joueur sur CE client
        opponentName: options.opponentName || (mode === 'ai' ? 'Intelligence Artificielle' : 'Adversaire'),
        capturedRed: 0,
        capturedBlack: 0,
        is3D: options.is3D || false,
        playerPieceColor: options.playerPieceColor || '#dc2626',
        opponentPieceColor: options.opponentPieceColor || '#1f2937',
        moveHistory: [],
        consecutiveDraws: 0,
        aiDifficulty: diff,
      },
      currentView: 'game',
    });

    if (mode === 'ai') {
      setTimeout(() => {
        const st = get().gameState;
        if (!st || st.gameOver) return;
        const aiMv = getAIMove(st.pieces, 'red', st.boardSize, diff, st.consecutiveDraws);
        if (aiMv) get().makeMove(aiMv);
      }, 800);
    }
  },

 selectPiece: (piece) => {
    const { gameState } = get();
    if (!gameState || gameState.gameOver) return;

    // Vérifier si c'est le tour du joueur (Rouge ou Noir)
    if (piece.color !== gameState.currentTurn) return;
    
    // En ligne ou défi : on ne peut toucher que sa propre couleur
    if (gameState.mode !== 'ai' && piece.color !== gameState.playerColor) return;

    const mandatory = hasMandatoryCapture(gameState.pieces, piece.color, gameState.boardSize);
    let moves = getValidMoves(piece, gameState.pieces, gameState.boardSize);
    
    // Règle africaine : si on peut manger, on DOIT manger
    if (mandatory) {
      moves = moves.filter(m => m.capturedPieces && m.capturedPieces.length > 0);
    }

    set({ gameState: { ...gameState, selectedPiece: piece, validMoves: moves } });
  },

  makeMove: async (move: Move) => {
    const { gameState } = get();
    if (!gameState || gameState.gameOver) return;

    let newPieces = [...gameState.pieces];
    const pieceIdx = newPieces.findIndex(p => p.row === move.fromRow && p.col === move.fromCol);
    if (pieceIdx === -1) return;

    const movingPiece = { ...newPieces[pieceIdx], row: move.toRow, col: move.toCol };

    // 1. Gérer les captures (retrait des pions mangés)
    let capR = gameState.capturedRed;
    let capB = gameState.capturedBlack;
    if (move.capturedPieces) {
      move.capturedPieces.forEach(cap => {
        const victim = newPieces.find(p => p.row === cap.row && p.col === cap.col);
        if (victim?.color === 'red') capR++; else capB++;
        newPieces = newPieces.filter(p => !(p.row === cap.row && p.col === cap.col));
      });
    }

    // 2. Promotion en Roi (Dame)
    if (!movingPiece.isKing) {
      if (movingPiece.color === 'red' && movingPiece.row === gameState.boardSize - 1) movingPiece.isKing = true;
      if (movingPiece.color === 'black' && movingPiece.row === 0) movingPiece.isKing = true;
    }

    // Mettre à jour la liste des pièces
    newPieces = newPieces.map(p => p.id === movingPiece.id ? movingPiece : p);

    // 3. Changement de tour et vérification victoire
    const nextTurn = gameState.currentTurn === 'red' ? 'black' : 'red';
    const gameStatus = checkGameOver(newPieces, nextTurn, gameState.boardSize, gameState.consecutiveDraws);

    set({
      gameState: {
        ...gameState,
        pieces: newPieces,
        currentTurn: nextTurn,
        selectedPiece: null,
        validMoves: [],
        capturedRed: capR,
        capturedBlack: capB,
        gameOver: gameStatus.over,
        winner: gameStatus.winner
      }
    });

    // 4. Déclencher l'IA si c'est son tour
    if (!gameStatus.over && gameState.mode === 'ai' && nextTurn !== gameState.playerColor) {
      setTimeout(() => get().aiMove(), 600);
    }
  },

  aiMove: () => {
    const { gameState } = get();
    if (!gameState || gameState.gameOver) return;
    const move = getAIMove(gameState.pieces, gameState.currentTurn, gameState.boardSize, gameState.aiDifficulty, gameState.consecutiveDraws);
    if (move) get().makeMove(move);
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  addChatMessage: async (content) => {
    const { currentUser, chatMessages, gameState } = get();
    if (!currentUser) return;
    const msg: ChatMessage = {
      id: uuidv4(),
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.name}`,
      content,
      timestamp: new Date(),
    };
    set({ chatMessages: [...chatMessages, msg] });

    // Sauvegarder en DB pour l'adversaire (Supabase Realtime en production)
    if (gameState) {
      await ChatService.create({
        matchId: gameState.matchId,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.name}`,
        content,
      });
      // Polling des nouveaux messages adverses (simulation Realtime si Supabase absent)
      // En production réelle, utiliser Supabase Realtime channel
      get().pollChatMessages();
    }
  },

  // Polling des messages chat adverses (simule le temps réel)
  pollChatMessages: async () => {
    const { gameState, currentUser, chatMessages } = get();
    if (!gameState || !currentUser) return;
    // En mode IA : pas de polling (l'IA ne répond pas par chat)
    if (gameState.mode === 'ai') return;
    // Simuler une réponse de l'adversaire en ligne avec délai humain réaliste
    // (En production réelle : Supabase Realtime channel subscription)
    const onlineReplies = [
      'Bien joué! 👏','Intéressant...','Attention à toi! 😈',
      'Tu ne gagneras pas! 💪','GG! Beau coup','🔥🔥🔥',
      'Bonne chance!','Je vais gagner! 😏','Haha tu rêves 😂',
      'Encore essaie 🎯','Pas mal...','Je contrôle la partie! 😎',
      'À toi de jouer!','🤔 Hmm...','Belle stratégie!',
    ];
    // Répondre seulement 40% du temps (comportement humain réaliste)
    if (Math.random() < 0.4 && chatMessages.length < 20) {
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        const st = get().gameState;
        if (!st || st.gameOver) return;
        const reply: ChatMessage = {
          id: uuidv4(),
          senderId: 'opponent-' + gameState.matchId,
          senderName: gameState.opponentName || 'Adversaire',
          content: onlineReplies[Math.floor(Math.random() * onlineReplies.length)],
          timestamp: new Date(),
        };
        set(s => ({
          chatMessages: [...s.chatMessages, reply],
          unreadMessages: s.chatOpen ? 0 : s.unreadMessages + 1,
        }));
      }, delay);
    }
  },

  toggleChat: () => set(s => ({ chatOpen: !s.chatOpen, unreadMessages: !s.chatOpen ? 0 : s.unreadMessages })),

  // ── Notifications ─────────────────────────────────────────────────────────
  addNotification: async (notif) => {
    const { currentUser } = get();
    const newNotif: Notification = { ...notif, id: uuidv4(), timestamp: new Date(), read: false };
    set(s => ({ notifications: [newNotif, ...s.notifications] }));

    if (currentUser) {
      await NotificationService.create({
        playerId: currentUser.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        fromPlayer: notif.fromPlayer || null,
        amount: notif.amount || null,
        matchId: notif.matchId || null,
      });
    }
  },

  markNotificationsRead: async () => {
    const { currentUser } = get();
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })), unreadMessages: 0 }));
    if (currentUser) await NotificationService.markAllRead(currentUser.id);
  },

  loadNotifications: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const notifs = await NotificationService.getByPlayer(currentUser.id);
    set({ notifications: notifs.map(dbNotificationToStore) });
  },

  // ── Wallet ────────────────────────────────────────────────────────────────
  updateBalance: async (amount, type, description, currency = 'CDF') => {
    const { currentUser } = get();
    if (!currentUser) return;
    const newBalance = Math.max(0, currentUser.balance + amount);
    const updatedUser: Player = {
      ...currentUser,
      balance: newBalance,
      totalWins: type === 'win' ? currentUser.totalWins + 1 : currentUser.totalWins,
      totalLosses: type === 'loss' ? currentUser.totalLosses + 1 : currentUser.totalLosses,
      totalEarnings: type === 'win' ? currentUser.totalEarnings + amount : currentUser.totalEarnings,
    };
    set({ currentUser: updatedUser });

    // Save to DB
    await PlayerService.update(currentUser.id, {
      balance: newBalance,
      totalWins: updatedUser.totalWins,
      totalLosses: updatedUser.totalLosses,
      totalEarnings: updatedUser.totalEarnings,
    });
    await TransactionService.create({
      playerId: currentUser.id,
      type,
      amount,
      currency,
      description,
      status: 'completed',
      method: null,
    });
    // Reload transactions
    await get().loadTransactions();
  },

  deposit: async (amount, method, currency) => {
    await get().updateBalance(amount, 'deposit', `Dépôt via ${method}`, currency);
    get().addNotification({ type: 'deposit', title: 'Dépôt réussi ✅', message: `${amount.toLocaleString()} ${currency} ajoutés à votre wallet`, amount });
  },

  withdraw: async (amount, method, currency) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.balance < amount) return;
    await get().updateBalance(-amount, 'withdraw', `Retrait via ${method}`, currency);
    get().addNotification({ type: 'withdraw', title: 'Retrait en cours ⏳', message: `${amount.toLocaleString()} ${currency} en cours de traitement`, amount });
  },

  loadTransactions: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const txs = await TransactionService.getByPlayer(currentUser.id);
    set({ transactions: txs.map(dbTransactionToStore) });
  },

  // ── Challenges ────────────────────────────────────────────────────────────
  sendChallenge: async (toPlayer, betAmount, currency, pieceCount, boardSize, timePerTurn, useVirtual = false, playerPieceColor?, opponentPieceColor?, is3D?) => {
    const { currentUser, adminSettings } = get();
    if (!currentUser) return;

    // Vérification solde avant envoi du défi
    const amtCDF = currency === 'USD' ? betAmount * adminSettings.cdfRate : betAmount;
    if (useVirtual) {
      if (currentUser.virtualBalanceCDF < amtCDF) return;
    } else {
      if (currentUser.balance < amtCDF) return;
    }

    const challenge = await ChallengeService.create({
      fromPlayerId: currentUser.id,
      toPlayerId: toPlayer.id,
      fromPlayerName: `${currentUser.firstName} ${currentUser.name}`,
      betAmount,
      currency,
      pieceCount,
      boardSize,
      timePerTurn,
    });
    const storeChallenge = dbChallengeToStore(challenge);
    set(s => ({ challenges: [storeChallenge, ...s.challenges] }));

    // Notif pour l'émetteur
    get().addNotification({
      type: 'challenge',
      title: '⚔️ Défi envoyé!',
      message: `Défi envoyé à ${toPlayer.name} — Mise: ${betAmount.toLocaleString()} ${currency} — En attente de réponse`,
      fromPlayer: toPlayer.name,
      matchId: challenge.id,
    });

    // Simuler une notif pour l'adversaire (en vrai ce serait via Supabase Realtime)
    await NotificationService.create({
      playerId: toPlayer.id,
      type: 'challenge',
      title: `⚔️ Défi de ${currentUser.firstName} ${currentUser.name}!`,
      message: `Mise: ${betAmount.toLocaleString()} ${currency} • ${boardSize}×${boardSize} • ${pieceCount} pions • ${timePerTurn}s/tour`,
      fromPlayer: `${currentUser.firstName} ${currentUser.name}`,
      amount: betAmount,
      matchId: challenge.id,
    });

    // Lancer la partie du côté émetteur avec les options sauvegardées
    void playerPieceColor; void opponentPieceColor; void is3D; // utilisés côté ChallengeSetup
  },

  acceptChallenge: async (challengeId) => {
    const { challenges, currentUser, adminSettings } = get();
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !currentUser) return;

    // Vérifier que l'acceptant a les fonds suffisants (solde réel ou virtuel)
    const amtCDF = challenge.currency === 'USD'
      ? challenge.betAmount * adminSettings.cdfRate
      : challenge.betAmount;

    const hasReal    = currentUser.balance >= amtCDF;
    const hasVirtual = currentUser.virtualBalanceCDF >= amtCDF;
    if (!hasReal && !hasVirtual) {
      get().addNotification({
        type: 'system',
        title: '⚠️ Solde insuffisant',
        message: `Vous n'avez pas assez de fonds pour accepter ce défi. Mise requise: ${challenge.betAmount.toLocaleString()} ${challenge.currency}`,
      });
      return;
    }

    // Utiliser virtuel si pas assez de réel
    const useVirtual = !hasReal && hasVirtual;

    await ChallengeService.updateStatus(challengeId, 'accepted');
    set(s => ({
      challenges: s.challenges.map(c =>
        c.id === challengeId ? { ...c, status: 'accepted' as const } : c
      ),
    }));

    // Notifier les deux joueurs
    get().addNotification({
      type: 'challenge',
      title: '✅ Défi accepté!',
      message: `Vous avez accepté le défi de ${challenge.fromPlayer}. La partie commence!`,
      fromPlayer: challenge.fromPlayer,
    });

    // Lancer la partie pour l'acceptant
    // L'acceptant joue 'red' (rouge commence en premier — avantage à l'acceptant)
    // L'émetteur du défi jouera 'black' de son côté
    get().initGame('challenge', {
      betAmount: challenge.betAmount,
      currency: challenge.currency,
      pieceCount: challenge.pieceCount,
      boardSize: challenge.boardSize,
      timePerTurn: challenge.timePerTurn,
      opponentName: challenge.fromPlayer,
      playerColor: 'red',   // ← l'acceptant contrôle les pions rouges (joue en premier)
      useVirtual,
    });
  },

  declineChallenge: async (challengeId) => {
    await ChallengeService.updateStatus(challengeId, 'declined');
    set(s => ({ challenges: s.challenges.map(c => c.id === challengeId ? { ...c, status: 'declined' } : c) }));
  },

  loadChallenges: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const challenges = await ChallengeService.getByPlayer(currentUser.id);
    set({ challenges: challenges.map(dbChallengeToStore) });
  },

  // ── Online Players ────────────────────────────────────────────────────────
  loadOnlinePlayers: async () => {
    const players = await PlayerService.getOnlinePlayers();
    const mapped: OnlinePlayer[] = players.map((p, i) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      wins: p.totalWins,
      isOnline: p.isOnline,
      avatar: p.avatar,
      rank: i + 1,
      earnings: p.totalEarnings,
    }));
    set({ onlinePlayers: mapped });
  },

  loadLeaderboard: async () => {
    const players = await PlayerService.getLeaderboard();
    const mapped: OnlinePlayer[] = players.map((p, i) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      wins: p.totalWins,
      isOnline: p.isOnline,
      avatar: p.avatar,
      rank: i + 1,
      earnings: p.totalEarnings,
    }));
    set({ leaderboard: mapped });
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  loadAdminSettings: async () => {
    const settings = await AdminService.getSettings();
    set({
      adminSettings: {
        aiMatchTime: settings.aiMatchTime,
        challengeMatchTime: settings.challengeMatchTime,
        platformFee: settings.platformFee,
        maxBet: settings.maxBet,
        minBet: settings.minBet,
        cdfRate: settings.cdfRate,
        usdRate: settings.usdRate,
        defaultCurrency: settings.defaultCurrency,
      },
    });
  },

  updateAdminSettings: async (settings) => {
    set(s => ({ adminSettings: { ...s.adminSettings, ...settings } }));
    await AdminService.updateSettings({
      aiMatchTime: settings.aiMatchTime,
      challengeMatchTime: settings.challengeMatchTime,
      platformFee: settings.platformFee,
      maxBet: settings.maxBet,
      minBet: settings.minBet,
      cdfRate: settings.cdfRate,
      usdRate: settings.usdRate,
      defaultCurrency: settings.defaultCurrency,
    });
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  // ── Abandon Game ──────────────────────────────────────────────────────────
  abandonGame: () => {
    const { gameState, currentUser, adminSettings } = get();
    if (!gameState || gameState.gameOver) return;

    if (gameState.mode === 'ai') {
      // Match IA : suppression immédiate sans pénalité financière
      MatchService.deleteFinished(gameState.matchId);
      ChatService.deleteByMatch(gameState.matchId);
      get().addNotification({
        type: 'system',
        title: 'Partie abandonnée',
        message: 'Vous avez abandonné la partie contre l\'IA — Aucune pénalité.',
      });
    } else if (gameState.betAmount > 0 && currentUser) {
      // Match en ligne/défi : l'abandonnant perd sa mise
      const feeRate = adminSettings.platformFee / 100;
      const totalFees = gameState.betAmount * feeRate * 2;
      const prize = gameState.betAmount * 2 - totalFees;

      // Perte de la mise pour l'abandonnant
      get().updateBalance(
        -gameState.betAmount,
        'loss',
        `Abandon de match — Mise perdue: ${gameState.betAmount.toLocaleString()} ${gameState.currency}`,
        gameState.currency
      );
      // Commission admin sur l'abandon
      if (totalFees > 0) {
        AdminWalletService.collectFee(totalFees, gameState.currency, gameState.matchId);
      }
      // Notification de perte
      get().addNotification({
        type: 'loss',
        title: 'Partie abandonnée ⚠️',
        message: `Vous avez abandonné — Mise perdue: ${gameState.betAmount.toLocaleString()} ${gameState.currency}. L'adversaire remporte ${prize.toLocaleString()} ${gameState.currency}.`,
        amount: gameState.betAmount,
      });
      // Suppression historique match
      MatchService.deleteFinished(gameState.matchId);
      ChatService.deleteByMatch(gameState.matchId);
    }

    // Terminer la partie comme défaite pour l'abandonnant
    const opponentColor: PieceColor = gameState.playerColor === 'red' ? 'black' : 'red';
    set({
      gameState: {
        ...gameState,
        gameOver: true,
        winner: opponentColor,
        selectedPiece: null,
        validMoves: [],
      },
    });
  },

  setAIDifficulty: (diff) => set({ aiDifficulty: diff }),

  convertAmount: (amount, from, to) => {
    const { adminSettings } = get();
    if (from === to) return amount;
    if (from === 'USD' && to === 'CDF') return amount * adminSettings.cdfRate;
    if (from === 'CDF' && to === 'USD') return amount / adminSettings.cdfRate;
    return amount;
  },

  decrementTimer: () => {
    const { gameState } = get();
    if (!gameState || gameState.gameOver) return;
    const isPlayerTurn = gameState.currentTurn === gameState.playerColor;
    if (isPlayerTurn) {
      const newTime = gameState.playerTimeLeft - 1;
      if (newTime <= 0) {
        set({ gameState: { ...gameState, playerTimeLeft: gameState.timePerTurn, currentTurn: gameState.playerColor === 'red' ? 'black' : 'red' } });
        if (gameState.mode === 'ai') setTimeout(() => get().aiMove(), 500);
      } else set({ gameState: { ...gameState, playerTimeLeft: newTime } });
    } else {
      const newTime = gameState.opponentTimeLeft - 1;
      if (newTime <= 0) set({ gameState: { ...gameState, opponentTimeLeft: gameState.timePerTurn, currentTurn: gameState.currentTurn === 'red' ? 'black' : 'red' } });
      else set({ gameState: { ...gameState, opponentTimeLeft: newTime } });
    }
  },
}));

export { getValidMoves, initPieces, getAIMove };
