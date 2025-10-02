import { NextResponse } from 'next/server';

// This route sends an email using the Resend API (https://resend.com) as an example.
// It expects the following server-side env vars to be set:
// RESEND_API_KEY - API key for Resend
// RESEND_FROM - Verified sender email (e.g., "noreply@example.com")

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipients, subject, html, data } = body;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      return NextResponse.json({ error: 'Email configuration missing on server' }, { status: 500 });
    }

    // Build a styled HTML template for the email
    function renderBriefTable(data: any) {
      if (!data || typeof data !== 'object') return '';
      return `<table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tbody>
        ${Object.entries(data).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return '';
          let display = '';
          if (Array.isArray(value)) {
            display = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
          } else if (typeof value === 'object') {
            display = Object.values(value).join(', ');
          } else {
            display = String(value);
          }
          return `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;color:#444;text-transform:capitalize;">${key.replace(/([A-Z])/g, ' $1')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;">${display}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
    }

    const styledHtml = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8f8fa;padding:32px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px #0001;padding:32px;">
          <h2 style="color:#4f46e5;font-size:24px;margin-bottom:8px;">Photography Brief</h2>
          <p style="color:#555;font-size:16px;margin-bottom:24px;">This is an auto-generated brief from BriefBuilder.</p>
          ${data ? renderBriefTable(data) : (html || '')}
          <div style="margin-top:32px;font-size:13px;color:#888;">Sent via <a href="https://briefbuilder.app" style="color:#4f46e5;text-decoration:none;">BriefBuilder</a></div>
        </div>
      </div>
    `;

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
        html: styledHtml,
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
