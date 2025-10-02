import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt as string;
    const jsonSchema = body.jsonSchema || null;
    const images: string[] = Array.isArray(body.images) ? body.images : [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server Gemini API key not configured' }, { status: 500 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Build parts: optional images first, then prompt text
    const parts: any[] = [];
    for (const url of images) {
      try {
        const match = url.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          const mimeType = match[1];
          const data = match[2];
          parts.push({ inlineData: { mimeType, data } });
        }
      } catch (_) {}
    }
    parts.push({ text: prompt });

    const payload: any = { contents: [{ parts }] };

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

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
