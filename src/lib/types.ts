export type Profile = {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  timezone: string;
  partner_id: string | null;
  invite_code: string;
  points: number;
  show_onboarding?: boolean;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'work' | 'health' | 'personal' | 'other';
  scheduled_time: string | null;
  is_completed: boolean;
  completed_at: string | null;
  share_with_partner: boolean;
  notify_partner: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  parent_recurring_id: string | null;
  date: string;
  points_value: number;
  created_at: string;
  updated_at: string;
};

export type TaskReaction = {
  id: string;
  task_id: string;
  user_id: string;
  reaction: '❤️' | '🔥' | '😡' | '👏';
  created_at: string;
};

export type Mood = {
  id: string;
  user_id: string;
  mood: '😊' | '😐' | '😔' | '😡' | '😴';
  note: string | null;
  date: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_system: boolean;
  message_type: 'text' | 'nudge' | 'hug' | 'system';
  read_at: string | null;
  created_at: string;
};

export type ActivityFeedItem = {
  id: string;
  user_id: string;
  partner_id: string | null;
  event_type: string;
  content: string;
  emoji: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

export type Streak = {
  id: string;
  user_id: string | null;
  streak_type: 'individual' | 'couple';
  current_count: number;
  longest_count: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Reward = {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  points_cost: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
};

export type HealthLog = {
  id: string;
  user_id: string;
  date: string;
  water_ml: number;
  sleep_hours: number;
  steps: number;
  created_at: string;
  updated_at: string;
};

export type MemoryJarItem = {
  id: string;
  user_id: string;
  content: string;
  emoji: string;
  milestone_type: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  challenge_type: 'compete' | 'collaborate';
  target_value: number;
  start_date: string;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
};

export type ChallengeProgress = {
  id: string;
  challenge_id: string;
  user_id: string;
  current_value: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

export type Nudge = {
  id: string;
  sender_id: string;
  receiver_id: string;
  task_id: string | null;
  message: string;
  created_at: string;
};

export type Excuse = {
  id: string;
  task_id: string;
  user_id: string;
  reason: string;
  created_at: string;
};
