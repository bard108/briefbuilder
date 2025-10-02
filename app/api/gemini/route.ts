import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const jsonSchema = body.jsonSchema || null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server Gemini API key not configured' }, { status: 500 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (jsonSchema) {
      payload.generationConfig = {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: text }, { status: response.status });
    }

    // return raw text to let client parse JSON when using schema
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
