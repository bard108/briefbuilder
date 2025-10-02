import { NextResponse } from 'next/server';

// This route sends an email using the Resend API (https://resend.com) as an example.
// It expects the following server-side env vars to be set:
// RESEND_API_KEY - API key for Resend
// RESEND_FROM - Verified sender email (e.g., "noreply@example.com")

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipients, subject, html } = body;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      return NextResponse.json({ error: 'Email configuration missing on server' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: subject || 'Brief from BriefBuilder',
        html,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: text }, { status: response.status });
    }

    return NextResponse.json({ ok: true, result: text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
