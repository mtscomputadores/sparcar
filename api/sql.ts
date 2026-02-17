
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

    let dbUrl = (connectionString || process.env.DATABASE_URL || '').trim();
    
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: 'DATABASE_URL não configurada' }), { status: 400, headers: HEADERS });
    }

    // O Proxy Global do Neon é o endpoint mais robusto para evitar erros 400 e de senha.
    const NEON_PROXY_URL = 'https://proxy.neon.tech/sql';

    // Garante que a string use postgresql:// e não tenha o sufixo -pooler que às vezes causa erro no modo HTTP
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
        message: result.message || 'Falha ao autenticar com o Neon. Verifique a senha.' 
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
