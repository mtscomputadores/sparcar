
export default async function handler(req: Request) {
  const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const password = "npg_Zle4yEaI6BiN";
  const host = "ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech";
  const endpoint = `https://${host}/sql`;

  const initQueries = [
    `CREATE TABLE IF NOT EXISTS loyalty_config (
      id INTEGER PRIMARY KEY,
      theme TEXT,
      stampsRequired INTEGER,
      rewardDescription TEXT,
      isActive BOOLEAN,
      companyName TEXT,
      companySubtitle TEXT,
      companyLogo TEXT,
      stampIcon TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS client_progress (
      clientKey TEXT PRIMARY KEY,
      stamps INTEGER,
      lastWashDate TEXT,
      phone TEXT
    );`
  ];

  async function neonFetch(query: string, params: any[] = []) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
      body: JSON.stringify({ query, params }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Erro no Neon');
    return result;
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'config';

  try {
    for (const q of initQueries) await neonFetch(q);

    if (req.method === 'GET') {
      const query = type === 'config' ? "SELECT * FROM loyalty_config WHERE id = 1" : "SELECT * FROM client_progress";
      const result = await neonFetch(query);
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const data = await req.json();
      let query = "";
      let params = [];

      if (type === 'config') {
        query = `
          INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon)
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET theme = EXCLUDED.theme, isActive = EXCLUDED.isActive, rewardDescription = EXCLUDED.rewardDescription, stampsRequired = EXCLUDED.stampsRequired, companyName = EXCLUDED.companyName;
        `;
        params = [data.theme, data.stampsRequired, data.rewardDescription, data.isActive, data.companyName, data.companySubtitle, data.companyLogo, data.stampIcon];
      } else {
        query = `
          INSERT INTO client_progress (clientKey, stamps, lastWashDate, phone)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (clientKey) DO UPDATE SET stamps = EXCLUDED.stamps, lastWashDate = EXCLUDED.lastWashDate, phone = EXCLUDED.phone;
        `;
        params = [data.clientKey, data.stamps, data.lastWashDate, data.phone];
      }
      await neonFetch(query, params);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });
  }
}
