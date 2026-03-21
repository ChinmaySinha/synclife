import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { health, taskCount, mood, tasks } = await request.json();

    const prompt = buildPrompt(health, taskCount, mood, tasks);

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are a caring, friendly wellness assistant for a productivity app called SyncLife. 
Give SHORT, warm, helpful suggestions (2-4 items). 
Be playful and human — NOT robotic. Use emojis.
Focus on health, productivity, and emotional well-being.
Return ONLY a JSON array of suggestion strings, nothing else.
Example: ["💧 Drink a glass of water — you're a bit behind!", "🚶 Take a 10-min walk to refresh"]`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '[]';

    // Parse the JSON array from the response
    let suggestions: string[];
    try {
      suggestions = JSON.parse(content);
    } catch {
      // If parsing fails, extract suggestions manually
      suggestions = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .slice(0, 4);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggestions error:', error);
    // Return fallback suggestions if AI fails
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

  if (health) {
    parts.push(`Health today: Water ${health.water}ml (goal 2500ml), Sleep ${health.sleep}h (goal 8h), Steps ${health.steps} (goal 10000)`);
  }

  if (taskCount !== undefined) {
    parts.push(`Tasks today: ${taskCount} tasks`);
  }

  if (mood) {
    const moodMap: Record<string, string> = {
      '😊': 'happy/energetic',
      '😐': 'neutral/okay',
      '😔': 'sad/down',
      '😡': 'frustrated/angry',
      '😴': 'tired/sleepy',
    };
    parts.push(`Current mood: ${moodMap[mood] || mood}`);
  }

  if (tasks && tasks.length > 0) {
    const completed = tasks.filter(t => t.is_completed).length;
    parts.push(`Task progress: ${completed}/${tasks.length} done`);
    const categories = tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    parts.push(`Categories: ${Object.entries(categories).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  }

  parts.push('Give me 3-4 personalized, warm, short suggestions based on this data.');

  return parts.join('\n');
}
