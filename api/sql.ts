
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

    // Usando sua URL exata como padrão absoluto
    const DATABASE_URL = process.env.DATABASE_URL_NEON || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração manual simplificada
    const atSplit = DATABASE_URL.split('@');
    const credentials = atSplit[0].split('//')[1];
    const password = credentials.split(':')[1];
    const hostPart = atSplit[1].split('/')[0].replace('-pooler', '');

    const endpoint = `https://${hostPart}/sql`;

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
        error: 'Erro Neon API', 
        details: result.message || 'Falha na execução SQL'
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Falha Proxy', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
