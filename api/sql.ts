
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

    // Chave fornecida pelo usuário
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração do Host (removendo -pooler para a API HTTP)
    const hostMatch = DATABASE_URL.match(/@([^/?#:]+)/);
    const rawHost = hostMatch ? hostMatch[1] : '';
    const cleanHost = rawHost.replace('-pooler', ''); 
    
    // Extração da Senha para o Bearer Token
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
      console.error("Neon Error:", result);
      return new Response(JSON.stringify({ 
        error: 'Erro no Banco de Dados', 
        details: result.message || 'Falha na execução do SQL' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    console.error("Critical Bridge Failure:", error.message);
    return new Response(JSON.stringify({ 
      error: 'Falha de Conexão', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
