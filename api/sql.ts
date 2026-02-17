
export default async function handler(req: Request) {
  const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  
  try {
    const { query, params } = await req.json();

    // Prioriza DATABASE_URL do ambiente Vercel. Caso não exista, usa a sua de fallback.
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração precisa do Host e Password para a API HTTP do Neon
    const hostMatch = DATABASE_URL.match(/@([^/?#:]+)/);
    const rawHost = hostMatch ? hostMatch[1] : '';
    const cleanHost = rawHost.replace('-pooler', ''); // API HTTP não usa o pooler
    
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
      console.error("Neon API Error Detail:", result);
      return new Response(JSON.stringify({ 
        error: 'Erro no Neon', 
        details: result.message || 'Erro de permissão ou conexão' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    console.error("Bridge Failure:", error.message);
    return new Response(JSON.stringify({ 
      error: 'Falha na Comunicação', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
