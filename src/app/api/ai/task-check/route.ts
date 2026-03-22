import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ suggestion: null });

    const body = await request.json();
    const { title, category, existingTasks, mood, healthData } = body;

    const prompt = `You are a caring personal wellness assistant for a productivity app called SyncLife.
A user is about to add a new task. Analyze it and give a SHORT, helpful suggestion (1-2 sentences max).

User's new task: "${title}" (category: ${category})
Their existing tasks today: ${existingTasks?.map((t: any) => t.title).join(', ') || 'none'}
Current mood: ${mood || 'not set'}
Health today: Water ${healthData?.water_ml || 0}ml, Sleep ${healthData?.sleep_hours || 0}h, Steps ${healthData?.steps || 0}

Rules:
- If they're overloading (5+ tasks), gently suggest prioritizing
- If adding a health task when mood is low, encourage them
- If they have no health tasks, maybe suggest one
- If everything looks balanced, say something encouraging
- Be warm, human, use 1 emoji max
- If task seems fine and balanced, respond with just "LGTM" (nothing else)
- Keep it under 30 words`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || null;

    // If AI says LGTM, no warning needed
    if (!suggestion || suggestion === 'LGTM' || suggestion.includes('LGTM')) {
      return NextResponse.json({ suggestion: null });
    }

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error('AI task check error:', error);
    return NextResponse.json({ suggestion: null });
  }
}
