import { NextResponse } from 'next/server';

// Helper function to get an active Salesforce Access Token via OAuth2 Password Flow
async function getSalesforceToken() {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.SF_CLIENT_ID!,
    client_secret: process.env.SF_CLIENT_SECRET!,
    username: process.env.SF_USERNAME!,
    password: process.env.SF_PASSWORD!,
  });

  const res = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) throw new Error('Salesforce Authentication Failed');
  return res.json(); // Returns { access_token, instance_url }
}

// 1. GET: Fetch all accounting tasks
export async function GET() {
  try {
    const { access_token, instance_url } = await getSalesforceToken();
    const sfRes = await fetch(`${instance_url}/services/apexrest/v1/AccountingTasks/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await sfRes.json();
    return NextResponse.json(data, { status: sfRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new accounting task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, instance_url } = await getSalesforceToken();

    const sfRes = await fetch(`${instance_url}/services/apexrest/v1/AccountingTasks/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await sfRes.json();
    return NextResponse.json(data, { status: sfRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
