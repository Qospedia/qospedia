import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, timestamp } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[CONTACT FORM] From: ${name} <${email}>`);
    console.log(`[CONTACT FORM] Subject: ${subject}`);
    console.log(`[CONTACT FORM] Message: ${message}`);
    console.log(`[EMAIL] To: qospedia.com@gmail.com`);

    return NextResponse.json({ success: true, message: 'Feedback received!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}