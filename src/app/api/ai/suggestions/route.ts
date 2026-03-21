import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { health, taskCount, mood, tasks } = await request.json();
    const prompt = buildPrompt(health, taskCount, mood, tasks);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        suggestions: [
          '💧 Stay hydrated — drink a glass of water!',
          '🧘 Take a 5-minute breathing break',
          '👟 A short walk can boost your energy',
          '🎉 You\'re doing great — keep it up!',
        ]
      });
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are a caring, friendly wellness assistant for SyncLife. 
Give SHORT, warm, helpful suggestions (2-4 items). 
Be playful and human — NOT robotic. Use emojis.
Return ONLY a JSON array of suggestion strings.
Example: ["💧 Drink a glass of water!", "🚶 Take a 10-min walk"]`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let suggestions: string[];
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
        .slice(0, 4);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({
      suggestions: [
        '💧 Stay hydrated — drink a glass of water!',
        '🧘 Take a 5-minute breathing break',
        '👟 A short walk can boost your energy',
        '🎉 You\'re doing great — keep it up!',
      ]
    });
  }
}

function buildPrompt(
  health: { water: number; sleep: number; steps: number } | null,
  taskCount: number,
  mood: string | null,
  tasks: { title: string; category: string; is_completed: boolean }[] | null
): string {
  const parts: string[] = [];
  if (health) parts.push(`Health: Water ${health.water}ml/2500, Sleep ${health.sleep}h/8, Steps ${health.steps}/10000`);
  if (taskCount !== undefined) parts.push(`Tasks today: ${taskCount}`);
  if (mood) parts.push(`Mood: ${mood}`);
  if (tasks && tasks.length > 0) {
    const done = tasks.filter(t => t.is_completed).length;
    parts.push(`Progress: ${done}/${tasks.length} tasks done`);
  }
  parts.push('Give 3-4 personalized, warm, short suggestions.');
  return parts.join('\n');
}
