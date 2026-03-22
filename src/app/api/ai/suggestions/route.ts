import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ suggestions: [] });

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Gather all user data
    const [tasksRes, moodRes, healthRes, streakRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).gte('date', weekAgo),
      supabase.from('moods').select('*').eq('user_id', user.id).gte('date', weekAgo).order('date', { ascending: false }),
      supabase.from('health_logs').select('*').eq('user_id', user.id).gte('date', weekAgo),
      supabase.from('streaks').select('*').eq('user_id', user.id).eq('streak_type', 'individual').single(),
    ]);

    const tasks = tasksRes.data || [];
    const moods = moodRes.data || [];
    const health = healthRes.data || [];
    const streak = streakRes.data;

    const todayTasks = tasks.filter(t => t.date === today);
    const completed = todayTasks.filter(t => t.is_completed).length;
    const total = todayTasks.length;
    const weekCompleted = tasks.filter(t => t.is_completed).length;
    const weekTotal = tasks.length;
    const avgSleep = health.length > 0 ? health.reduce((s, h) => s + h.sleep_hours, 0) / health.length : 0;
    const avgWater = health.length > 0 ? health.reduce((s, h) => s + h.water_ml, 0) / health.length : 0;
    const latestMood = moods[0]?.mood || 'not set';
    const categories = todayTasks.reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    const prompt = `You are a smart, empathetic wellness coach for a productivity app called SyncLife.
Based on this user's data, give exactly 3 actionable suggestions. Each should be 1 sentence, warm and specific.

DATA:
- Today: ${completed}/${total} tasks done (categories: ${JSON.stringify(categories)})
- This week: ${weekCompleted}/${weekTotal} tasks done
- Current mood: ${latestMood}
- Avg sleep: ${avgSleep.toFixed(1)}h/night
- Avg water: ${(avgWater / 1000).toFixed(1)}L/day
- Streak: ${streak?.current_count || 0} days
- Time of day: ${new Date().getHours()}:00

Rules:
- Be specific about what to do (not vague "take care of yourself")
- Reference their actual data (sleep, water, tasks)
- If mood is sad/tired, be extra gentle
- Use 1 emoji per suggestion
- Format: Return exactly 3 lines, each starting with an emoji
- No numbering, no bullets, just the line`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const suggestions = raw.split('\n').filter(l => l.trim().length > 0).slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({
      suggestions: [
        '💧 Remember to stay hydrated throughout the day!',
        '🚶 A short walk can boost your focus and mood.',
        '✨ You\'re doing great — keep the momentum going!',
      ]
    });
  }
}
