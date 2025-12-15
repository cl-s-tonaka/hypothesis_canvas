import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, model } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = model || process.env.OPENAI_MODEL || 'gpt-4';

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API Key not set.' }, { status: 500 });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'あなたは日本語で仮説検証を支援するAIアシスタントです。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ result: data.choices?.[0]?.message?.content || '' });
}
