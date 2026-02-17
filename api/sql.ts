
export default async function handler(req: Request) {
  const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: HEADERS });

  try {
    const body = await req.json();
    const { query, params } = body;

    // A variável DATABASE_URL deve ser configurada no painel da Vercel ou no .env local
    // O fallback abaixo é o que você forneceu, mas o ideal é que venha do ambiente
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração robusta do host para o endpoint HTTP do Neon
    // Exemplo: ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech -> ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech
    const hostMatch = DATABASE_URL.match(/@([^/?#:]+)/);
    if (!hostMatch) throw new Error("URL do banco de dados inválida no DATABASE_URL.");
    
    const rawHost = hostMatch[1];
    const cleanHost = rawHost.replace('-pooler', '');
    const neonHttpEndpoint = `https://${cleanHost}/sql`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos para operações de banco

    const response = await fetch(neonHttpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        params, 
        // O proxy HTTP do Neon precisa da string de conexão para saber em qual banco executar
        connectionString: DATABASE_URL 
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    
    const result = await response.json();

    if (!response.ok) {
      console.error("Erro retornado pelo Neon:", result);
      return new Response(JSON.stringify({ 
        error: 'Erro no Banco Remoto', 
        details: result.message || 'Erro desconhecido no Neon' 
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    console.error("Falha Crítica na API SQL:", error.message);
    return new Response(JSON.stringify({ 
      error: 'Falha de Comunicação', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
