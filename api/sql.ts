
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

    // Chave exata fornecida pelo usuário no prompt anterior
    const DATABASE_URL = process.env.DATABASE_URL_NEON || "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Extração manual para evitar bugs de regex em diferentes ambientes
    // Exemplo: postgresql://neondb_owner:PASSWORD@ep-host-pooler.region.neon.tech/neondb
    const parts = DATABASE_URL.split('@');
    if (parts.length < 2) throw new Error("URL de conexão inválida");
    
    const credentials = parts[0].split('//')[1]; // neondb_owner:PASSWORD
    const password = credentials.split(':')[1];
    
    const hostPart = parts[1].split('/')[0]; // ep-host-pooler.region.neon.tech
    const cleanHost = hostPart.replace('-pooler', ''); // ep-host.region.neon.tech

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
      console.error("Erro retornado pelo Neon:", result);
      return new Response(JSON.stringify({ 
        error: 'Erro na API do Neon', 
        details: result.message || JSON.stringify(result)
      }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error: any) {
    console.error("Falha Crítica no Proxy SQL:", error.message);
    return new Response(JSON.stringify({ 
      error: 'Falha de Conexão Interna', 
      message: error.message 
    }), { status: 500, headers: HEADERS });
  }
}
