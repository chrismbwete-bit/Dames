import { createClient } from '@supabase/supabase-js';

// ─── Supabase Config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://odaksyrfoujnpzzoetew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYWtzeXJmb3VqbnB6em9ldGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTI3OTAsImV4cCI6MjA4NjUyODc5MH0.8L8kBAQK_ITaSpPTde3G2dJBGfFRWCwiRDV5nu0YhZc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types matching Supabase tables ───────────────────────────────────────────

export interface DBPlayer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password_hash: string;
  balance: number;
  virtual_balance_cdf: number;
  virtual_balance_usd: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  total_earnings: number;
  avatar: string;
  is_online: boolean;
  preferred_currency: 'CDF' | 'USD';
  role: 'player' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface DBMatch {
  id: string;
  player1_id: string;
  player2_id: string | null;
  mode: 'ai' | 'online' | 'challenge';
  status: 'pending' | 'active' | 'finished' | 'cancelled';
  winner_id: string | null;
  bet_amount: number;
  currency: 'CDF' | 'USD';
  board_size: number;
  piece_count: number;
  time_per_turn: number;
  consecutive_draws: number;
  board_state: string;
  created_at: string;
  finished_at: string | null;
}

export interface DBTransaction {
  id: string;
  player_id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'loss' | 'fee';
  amount: number;
  currency: 'CDF' | 'USD';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  method: string | null;
  created_at: string;
}

export interface DBNotification {
  id: string;
  player_id: string;
  type: 'challenge' | 'win' | 'loss' | 'deposit' | 'withdraw' | 'chat' | 'system';
  title: string;
  message: string;
  read: boolean;
  from_player: string | null;
  amount: number | null;
  match_id: string | null;
  created_at: string;
}

export interface DBChallenge {
  id: string;
  from_player_id: string;
  to_player_id: string;
  from_player_name: string;
  bet_amount: number;
  currency: 'CDF' | 'USD';
  piece_count: number;
  board_size: number;
  time_per_turn: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface DBChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface DBAdminSettings {
  id: string;
  ai_match_time: number;
  challenge_match_time: number;
  platform_fee: number;
  max_bet: number;
  min_bet: number;
  cdf_rate: number;
  usd_rate: number;
  default_currency: 'CDF' | 'USD';
  updated_at: string;
}
