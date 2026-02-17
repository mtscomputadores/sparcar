
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const token = "npg_Zle4yEaI6BiN";
  const endpoint = "https://ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech/sql";

  const neon = async (query: string, params: any[] = []) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query, params, database: "neondb" }),
    });
    return await res.json();
  };

  try {
    await neon(`CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT, photo TEXT, daysWorked INTEGER DEFAULT 0, dailyRate NUMERIC DEFAULT 0, commission NUMERIC DEFAULT 0, unpaid NUMERIC DEFAULT 0, queuePosition INTEGER DEFAULT 0, isActive BOOLEAN DEFAULT TRUE);`);

    if (req.method === 'GET') {
      const result = await neon("SELECT * FROM staff ORDER BY queuePosition ASC");
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const s = await req.json();
      await neon(`INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET queuePosition=EXCLUDED.queuePosition, isActive=EXCLUDED.isActive, unpaid=EXCLUDED.unpaid, daysWorked=EXCLUDED.daysWorked, commission=EXCLUDED.commission, dailyRate=EXCLUDED.dailyRate, name=EXCLUDED.name, role=EXCLUDED.role;`, 
      [s.id, s.name, s.role, s.photo, s.daysWorked, s.dailyRate, s.commission, s.unpaid, s.queuePosition, s.isActive]);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
    return new Response(JSON.stringify({ error: 'Inválido' }), { status: 405, headers: HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: HEADERS });
  }
}
