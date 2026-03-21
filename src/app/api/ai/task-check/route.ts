import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { taskTitle, currentTaskCount } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;
    
    // If no API key, fast fallback to allow it.
    if (!apiKey) {
      return NextResponse.json({
        shouldWarn: false,
        message: 'Go for it!'
      });
    }

    // Call Groq to evaluate the task addition
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
            content: `You are SyncLife's playful, slightly sarcastic but deeply caring AI productivity assistant. 
The user is trying to add a NEW task. They currently have ${currentTaskCount} tasks on their plate today.
Evaluate if adding "${taskTitle}" is a good idea. 
If they have 5 or more tasks and are adding something heavy, WARN THEM playfully (like a concerned friend).
If it's fine, encourage them.

You MUST respond ONLY with a valid JSON object in this exact format:
{
  "shouldWarn": true/false, // true if they should reconsider adding this (e.g. too many tasks)
  "message": "Your snappy, playful, short comment here with emojis"
}
Do not return markdown formatting, just the JSON string.`
          }
        ],
        temperature: 0.9,
        max_tokens: 200,
        response_format: { type: "json_object" }
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed);
      } catch (e) {
        console.error('Failed to parse AI response', content);
      }
    }

    return NextResponse.json({ shouldWarn: false, message: 'Sounds good!' });

  } catch (error) {
    console.error('Task check AI error:', error);
    return NextResponse.json({ shouldWarn: false, message: 'Go for it!' });
  }
}
