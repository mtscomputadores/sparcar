
export default async function handler(req: Request) {
  const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  
  try {
    const body = await req.json();
    const { query, params } = body;

    // Chave exata fornecida pelo usuário
    const DATABASE_URL = process.env.DATABASE_URL_NEON || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração robusta do host
    // De: postgresql://user:pass@ep-id-pooler.region.aws.neon.tech/db
    // Para: ep-id.region.aws.neon.tech
    const hostMatch = DATABASE_URL.match(/@([^/?#:]+)/);
    const rawHost = hostMatch ? hostMatch[1] : '';
    const cleanHost = rawHost.replace('-pooler', ''); 
    
    // Senha (usada como Bearer Token na API HTTP do Neon)
    const passMatch = DATABASE_URL.match(/:\/\/([^:]+):([^@]+)@/);
    const password = passMatch ? passMatch[2] : '';

    const endpoint = `https://${cleanHost}/sql`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`
      },
      body: JSON.stringify({ query, params }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: 'Neon API Error', 
        details: result.message || 'Erro ao executar comando SQL no Neon' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Connection Failure', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
