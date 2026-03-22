import type { Task } from './types';

/**
 * Calculate streak on-the-fly from task history.
 * A "streak day" = user completed at least 1 task on that date.
 * Returns current consecutive days streak and longest ever.
 */
export function calculateStreak(tasks: Task[]): { current: number; longest: number } {
  // Get unique dates where at least 1 task was completed
  const completedDates = new Set<string>();

  for (const task of tasks) {
    if (task.is_completed && task.completed_at) {
      const date = task.completed_at.split('T')[0];
      completedDates.add(date);
    }
  }

  if (completedDates.size === 0) return { current: 0, longest: 0 };

  // Sort dates descending
  const sorted = Array.from(completedDates).sort((a, b) => b.localeCompare(a));

  // Check if today or yesterday is in the streak (to allow for "still going" streaks)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let current = 0;
  let longest = 0;
  let streak = 0;

  // Calculate longest streak
  const allSorted = Array.from(completedDates).sort();
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(allSorted[i - 1]);
      const curr = new Date(allSorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    longest = Math.max(longest, streak);
  }

  // Calculate current streak (must include today or yesterday)
  if (!sorted.includes(today) && !sorted.includes(yesterday)) {
    current = 0;
  } else {
    current = 1;
    const startDate = sorted.includes(today) ? today : yesterday;
    let checkDate = new Date(startDate);

    while (true) {
      checkDate = new Date(checkDate.getTime() - 86400000);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

/**
 * Calculate couple streak — both users completed at least 1 task on same day
 */
export function calculateCoupleStreak(
  userTasks: Task[],
  partnerTasks: Task[]
): { current: number; longest: number } {
  const userDates = new Set<string>();
  const partnerDates = new Set<string>();

  for (const t of userTasks) {
    if (t.is_completed && t.completed_at) userDates.add(t.completed_at.split('T')[0]);
  }
  for (const t of partnerTasks) {
    if (t.is_completed && t.completed_at) partnerDates.add(t.completed_at.split('T')[0]);
  }

  // Intersection: dates where BOTH completed
  const bothDates = new Set<string>();
  for (const d of userDates) {
    if (partnerDates.has(d)) bothDates.add(d);
  }

  // Reuse same logic
  const fakeTasks: Task[] = Array.from(bothDates).map(d => ({
    id: d, user_id: '', title: '', description: null,
    category: 'other', scheduled_time: null, is_completed: true,
    completed_at: d + 'T00:00:00Z', share_with_partner: false,
    notify_partner: false, is_recurring: false, recurrence_rule: null,
    parent_recurring_id: null, date: d, points_value: 0,
    created_at: d, updated_at: d,
  }));

  return calculateStreak(fakeTasks);
}
