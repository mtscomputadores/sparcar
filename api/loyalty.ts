
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const HEADERS = { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type', 
    'Content-Type': 'application/json' 
  };
  
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const password = "npg_Zle4yEaI6BiN";
  const host = "ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech";
  const endpoint = `https://${host}/sql`;

  async function neonFetch(query: string, params: any[] = []) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
      body: JSON.stringify({ query, params, database: "neondb" }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Erro Neon DB');
    return result;
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'config';

  try {
    await neonFetch(`
      CREATE TABLE IF NOT EXISTS loyalty_config (
        id INTEGER PRIMARY KEY,
        theme TEXT,
        stampsRequired INTEGER,
        rewardDescription TEXT,
        isActive BOOLEAN,
        companyName TEXT,
        companySubtitle TEXT,
        companyLogo TEXT,
        stampIcon TEXT
      );
    `);
    await neonFetch(`
      CREATE TABLE IF NOT EXISTS client_progress (
        clientKey TEXT PRIMARY KEY,
        stamps INTEGER,
        lastWashDate TEXT,
        phone TEXT
      );
    `);

    if (req.method === 'GET') {
      const query = type === 'config' ? "SELECT * FROM loyalty_config WHERE id = 1" : "SELECT * FROM client_progress";
      const result = await neonFetch(query);
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const data = await req.json();
      if (type === 'config') {
        const query = `
          INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon)
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET 
            theme = EXCLUDED.theme, 
            isActive = EXCLUDED.isActive, 
            rewardDescription = EXCLUDED.rewardDescription, 
            stampsRequired = EXCLUDED.stampsRequired, 
            companyName = EXCLUDED.companyName,
            companySubtitle = EXCLUDED.companySubtitle,
            companyLogo = EXCLUDED.companyLogo,
            stampIcon = EXCLUDED.stampIcon;
        `;
        await neonFetch(query, [data.theme, data.stampsRequired, data.rewardDescription, data.isActive, data.companyName, data.companySubtitle, data.companyLogo, data.stampIcon]);
      } else {
        const query = `
          INSERT INTO client_progress (clientKey, stamps, lastWashDate, phone)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (clientKey) DO UPDATE SET 
            stamps = EXCLUDED.stamps, 
            lastWashDate = EXCLUDED.lastWashDate, 
            phone = EXCLUDED.phone;
        `;
        await neonFetch(query, [data.clientKey, data.stamps, data.lastWashDate, data.phone]);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });
  }
}
