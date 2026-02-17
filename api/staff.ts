
export default async function handler(req: Request) {
  const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const password = "npg_Zle4yEaI6BiN";
  const host = "ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech";
  const endpoint = `https://${host}/sql`;

  const initQuery = `
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      photo TEXT,
      daysWorked INTEGER DEFAULT 0,
      dailyRate NUMERIC DEFAULT 0,
      commission NUMERIC DEFAULT 0,
      unpaid NUMERIC DEFAULT 0,
      queuePosition INTEGER DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE
    );
  `;

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

  try {
    await neonFetch(initQuery);

    if (req.method === 'GET') {
      const result = await neonFetch("SELECT * FROM staff ORDER BY queuePosition ASC");
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const s = await req.json();
      const query = `
        INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET 
          queuePosition = EXCLUDED.queuePosition, 
          isActive = EXCLUDED.isActive, 
          unpaid = EXCLUDED.unpaid, 
          daysWorked = EXCLUDED.daysWorked, 
          commission = EXCLUDED.commission,
          dailyRate = EXCLUDED.dailyRate;
      `;
      const params = [s.id, s.name, s.role, s.photo, s.daysWorked, s.dailyRate, s.commission, s.unpaid, s.queuePosition, s.isActive];
      await neonFetch(query, params);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });
  }
}
