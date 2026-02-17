
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

    // String de conexão vinda do ambiente (configurar na Vercel) ou fallback
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // 1. Limpa a URL para pegar o host correto
    const hostMatch = DATABASE_URL.match(/@([^/?#:]+)/);
    const host = hostMatch ? hostMatch[1].replace('-pooler', '') : '';
    
    // 2. Extrai a senha para autenticação (Bearer token no Neon HTTP)
    const passMatch = DATABASE_URL.match(/:\/\/([^:]+):([^@]+)@/);
    const password = passMatch ? passMatch[2] : '';

    const endpoint = `https://${host}/sql`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}` // O Neon aceita a senha do banco como token na API HTTP
      },
      body: JSON.stringify({ query, params }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: 'Erro no Neon', 
        details: result.message || 'Erro desconhecido' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Falha na Ponte SQL', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
