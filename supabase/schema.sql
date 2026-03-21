-- ============================================
-- SyncLife Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  avatar_url text,
  timezone text default 'Asia/Kolkata',
  partner_id uuid references public.profiles(id),
  invite_code text unique default encode(gen_random_bytes(4), 'hex'),
  points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can view partner profile" on public.profiles
  for select using (id = (select partner_id from public.profiles where id = auth.uid()));

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Allow viewing profiles by invite code (for pairing)
create policy "Anyone can view profiles by invite code" on public.profiles
  for select using (invite_code is not null);

-- ============================================
-- 2. PARTNERSHIPS
-- ============================================
create table public.partnerships (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) not null,
  user2_id uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.partnerships enable row level security;

create policy "Users can view own partnerships" on public.partnerships
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create partnerships" on public.partnerships
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- ============================================
-- 3. TASKS
-- ============================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  category text check (category in ('work', 'health', 'personal', 'other')) default 'other',
  scheduled_time timestamptz,
  is_completed boolean default false,
  completed_at timestamptz,
  share_with_partner boolean default false,
  notify_partner boolean default false,
  is_recurring boolean default false,
  recurrence_rule text, -- 'daily', 'weekly', 'weekdays', or cron-like
  parent_recurring_id uuid references public.tasks(id),
  date date default current_date,
  points_value integer default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

create policy "Users can view partner shared tasks" on public.tasks
  for select using (
    share_with_partner = true and 
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 4. TASK REACTIONS
-- ============================================
create table public.task_reactions (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  reaction text check (reaction in ('❤️', '🔥', '😡', '👏')) not null,
  created_at timestamptz default now(),
  unique(task_id, user_id, reaction)
);

alter table public.task_reactions enable row level security;

create policy "Users can manage own reactions" on public.task_reactions
  for all using (auth.uid() = user_id);

create policy "Users can view reactions on own tasks" on public.task_reactions
  for select using (
    task_id in (select id from public.tasks where user_id = auth.uid())
  );

-- ============================================
-- 5. MOODS
-- ============================================
create table public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  mood text check (mood in ('😊', '😐', '😔', '😡', '😴')) not null,
  note text,
  date date default current_date,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.moods enable row level security;

create policy "Users can manage own moods" on public.moods
  for all using (auth.uid() = user_id);

create policy "Users can view partner moods" on public.moods
  for select using (
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 6. MESSAGES
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  is_system boolean default false,
  message_type text default 'text', -- 'text', 'nudge', 'hug', 'system'
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can update own messages" on public.messages
  for update using (auth.uid() = receiver_id);

-- ============================================
-- 7. ACTIVITY FEED
-- ============================================
create table public.activity_feed (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  partner_id uuid references public.profiles(id),
  event_type text not null, -- 'task_completed', 'task_skipped', 'streak_milestone', 'mood_set', etc.
  content text not null,
  emoji text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.activity_feed enable row level security;

create policy "Users can view own and partner feed" on public.activity_feed
  for select using (
    auth.uid() = user_id or 
    auth.uid() = partner_id or
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users can create own feed items" on public.activity_feed
  for insert with check (auth.uid() = user_id);

-- ============================================
-- 8. STREAKS
-- ============================================
create table public.streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  streak_type text check (streak_type in ('individual', 'couple')) not null,
  current_count integer default 0,
  longest_count integer default 0,
  last_completed_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can manage own streaks" on public.streaks
  for all using (
    auth.uid() = user_id or 
    streak_type = 'couple'
  );

-- ============================================
-- 9. REWARDS
-- ============================================
create table public.rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  emoji text default '🎁',
  points_cost integer default 100,
  is_redeemed boolean default false,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.rewards enable row level security;

create policy "Users can manage own rewards" on public.rewards
  for all using (auth.uid() = user_id);

create policy "Users can view partner rewards" on public.rewards
  for select using (
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 10. HEALTH LOGS
-- ============================================
create table public.health_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  date date default current_date,
  water_ml integer default 0,
  sleep_hours numeric(3,1) default 0,
  steps integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.health_logs enable row level security;

create policy "Users can manage own health logs" on public.health_logs
  for all using (auth.uid() = user_id);

create policy "Users can view partner health logs" on public.health_logs
  for select using (
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 11. MEMORY JAR
-- ============================================
create table public.memory_jar (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  emoji text default '✨',
  milestone_type text, -- 'streak', 'both_complete', 'custom'
  created_at timestamptz default now()
);

alter table public.memory_jar enable row level security;

create policy "Users can manage memories" on public.memory_jar
  for all using (
    auth.uid() = user_id or
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  body text not null,
  type text default 'info', -- 'nudge', 'streak', 'task', 'mood', 'info'
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- ============================================
-- 13. CHALLENGES
-- ============================================
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  emoji text default '🎯',
  challenge_type text check (challenge_type in ('compete', 'collaborate')) default 'collaborate',
  target_value integer default 1,
  start_date date default current_date,
  end_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Users can manage challenges" on public.challenges
  for all using (true);

-- Challenge progress
create table public.challenge_progress (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  current_value integer default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(challenge_id, user_id)
);

alter table public.challenge_progress enable row level security;

create policy "Users can manage own progress" on public.challenge_progress
  for all using (auth.uid() = user_id);

create policy "Users can view partner progress" on public.challenge_progress
  for select using (
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- 14. NUDGES
-- ============================================
create table public.nudges (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  task_id uuid references public.tasks(id),
  message text default 'Hey, don''t forget! 💕',
  created_at timestamptz default now()
);

alter table public.nudges enable row level security;

create policy "Users can send nudges" on public.nudges
  for insert with check (auth.uid() = sender_id);

create policy "Users can view own nudges" on public.nudges
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ============================================
-- 15. EXCUSES
-- ============================================
create table public.excuses (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  reason text not null,
  created_at timestamptz default now()
);

alter table public.excuses enable row level security;

create policy "Users can manage own excuses" on public.excuses
  for all using (auth.uid() = user_id);

create policy "Users can view partner excuses" on public.excuses
  for select using (
    user_id = (select partner_id from public.profiles where id = auth.uid())
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute procedure public.update_updated_at();

create trigger update_health_logs_updated_at before update on public.health_logs
  for each row execute procedure public.update_updated_at();

create trigger update_streaks_updated_at before update on public.streaks
  for each row execute procedure public.update_updated_at();

-- Enable Realtime for key tables
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.moods;
alter publication supabase_realtime add table public.health_logs;

-- ============================================
-- SEED: Default Challenges
-- ============================================
insert into public.challenges (title, description, emoji, challenge_type, target_value) values
  ('💧 Hydration Hero', 'Drink 2L of water today', '💧', 'collaborate', 2000),
  ('🚶 Step Master', 'Walk 10,000 steps today', '🚶', 'compete', 10000),
  ('📚 Reading Time', 'Read for 30 minutes', '📚', 'collaborate', 30),
  ('🧘 Mindful Moment', 'Meditate for 10 minutes', '🧘', 'collaborate', 10),
  ('🍎 No Skipped Meals', 'Eat all 3 meals today', '🍎', 'collaborate', 3);
