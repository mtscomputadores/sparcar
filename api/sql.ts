
export const config = {
  runtime: 'edge',
};

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Neon-Connection-String',
  'Content-Type': 'application/json',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: HEADERS });
  }

  try {
    const body = await req.json();
    const { query, params, connectionString } = body;

    // Usando a URL fornecida pelo usuário como fallback imediato para o preview
    const USER_DATABASE_URL = "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    let dbUrl = (connectionString || process.env.DATABASE_URL || USER_DATABASE_URL).trim();
    
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: 'DATABASE_URL não configurada' }), { status: 400, headers: HEADERS });
    }

    const NEON_PROXY_URL = 'https://proxy.neon.tech/sql';

    // Limpeza da string para modo HTTP
    dbUrl = dbUrl.replace('-pooler', '');

    const response = await fetch(NEON_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': dbUrl,
      },
      body: JSON.stringify({ query, params }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro Neon:', result);
      return new Response(JSON.stringify({ 
        error: result.error || 'Erro de Autenticação/Conexão', 
        message: result.message || 'Falha ao conectar com o Neon. Verifique os dados.' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error: any) {
    console.error('Erro API:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro de Proxy', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
