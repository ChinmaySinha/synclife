import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export function getGreeting(name: string): { text: string; emoji: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: `Night owl, ${name}`, emoji: '🦉', subtext: 'Still up? Remember to rest!' };
  if (hour < 12) return { text: `Good morning, ${name}`, emoji: '☀️', subtext: 'Ready to crush today?' };
  if (hour < 17) return { text: `Good afternoon, ${name}`, emoji: '🌤️', subtext: 'Keep the momentum going!' };
  if (hour < 21) return { text: `Good evening, ${name}`, emoji: '🌅', subtext: 'How was your day?' };
  return { text: `Good night, ${name}`, emoji: '🌙', subtext: 'Wind down and reflect.' };
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function getCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'work': return 'var(--color-work)';
    case 'health': return 'var(--color-health)';
    case 'personal': return 'var(--color-personal)';
    default: return 'var(--color-other)';
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'work': return '💼';
    case 'health': return '💪';
    case 'personal': return '✨';
    default: return '📌';
  }
}

export const playfulIncompleteMessages = [
  "Oops, looks like this one slipped! No worries 💕",
  "Life happens! Tomorrow's a new chance 🌟",
  "Hey, at least you're honest about it! 😄",
  "Skip day? We all need those sometimes 🫶",
  "Not today, but tomorrow you'll smash it! 💪",
  "Don't sweat it — progress isn't linear 🎢",
  "Take a breath. You're doing amazing overall ✨",
  "Even superheroes take days off 🦸",
];

export const randomFacts = [
  "💡 Couples who plan together have 23% higher goal completion rates!",
  "💡 A 10-minute walk boosts creativity by 60%!",
  "💡 Writing down goals makes you 42% more likely to achieve them!",
  "💡 Drinking water first thing in the morning boosts metabolism by 24%!",
  "💡 The most productive people take breaks every 52 minutes!",
  "💡 Smiling at your screen right now would boost your mood — try it! 😊",
];

export const couplePrompts = [
  "💌 Send a compliment to your partner right now!",
  "💌 What's one thing your partner did today that you appreciate?",
  "💌 Plan a surprise mini-reward for your partner!",
  "💌 Share a memory that makes you smile together!",
  "💌 Rate your partner's dedication this week: ⭐⭐⭐⭐⭐",
];

export const surpriseRewards = [
  "🎁 Surprise! +10 bonus points today!",
  "🎁 You've unlocked a mystery badge! Keep going!",
  "🎁 Free pass: Skip one task guilt-free today!",
  "🎁 Achievement unlocked: You opened the app today! 🏆",
];

export function getRandomEngagement(): { type: string; content: string } {
  const types = ['fact', 'prompt', 'reward'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  switch (type) {
    case 'fact':
      return { type, content: randomFacts[Math.floor(Math.random() * randomFacts.length)] };
    case 'prompt':
      return { type, content: couplePrompts[Math.floor(Math.random() * couplePrompts.length)] };
    case 'reward':
      return { type, content: surpriseRewards[Math.floor(Math.random() * surpriseRewards.length)] };
    default:
      return { type: 'fact', content: randomFacts[0] };
  }
}

export function getPlayfulMessage(): string {
  return playfulIncompleteMessages[Math.floor(Math.random() * playfulIncompleteMessages.length)];
}

export const nudgeMessages = [
  "Hey love, don't forget about your task! 💕",
  "Gentle poke! You've got this 👉👈",
  "Just checking in — need any help? 🫶",
  "Your partner believes in you! 💪",
  "Tick tock! But no pressure 😄",
  "Friendly reminder from your favorite person! 💌",
];

export function getRandomNudge(): string {
  return nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
}
