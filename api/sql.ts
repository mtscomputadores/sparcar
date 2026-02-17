
export default async function handler(req: Request) {
  const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Neon-Connection-String',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: HEADERS });

  try {
    const body = await req.json();
    const { query, params } = body;

    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    const cleanDbUrl = DATABASE_URL.replace('-pooler', '');

    const response = await fetch('https://proxy.neon.tech/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': cleanDbUrl,
      },
      body: JSON.stringify({ query, params }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: response.status, headers: HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro Interno', message: error.message }), { status: 500, headers: HEADERS });
  }
}
