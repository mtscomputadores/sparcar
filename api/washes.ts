
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const HEADERS = { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type', 
    'Content-Type': 'application/json' 
  };
  
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
    await neon(`CREATE TABLE IF NOT EXISTS washes (id TEXT PRIMARY KEY, clientName TEXT NOT NULL, clientPhone TEXT, plate TEXT, model TEXT, type TEXT, status TEXT, assignedStaff TEXT, price NUMERIC, services TEXT, vehicleType TEXT, date TEXT);`);

    if (req.method === 'GET') {
      const result = await neon("SELECT * FROM washes ORDER BY date DESC, id DESC LIMIT 100");
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const w = await req.json();
      await neon(`INSERT INTO washes (id, clientName, clientPhone, plate, model, type, status, assignedStaff, price, services, vehicleType, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, price=EXCLUDED.price, clientName=EXCLUDED.clientName, clientPhone=EXCLUDED.clientPhone, plate=EXCLUDED.plate, model=EXCLUDED.model;`, 
      [w.id, w.clientName, w.clientPhone, w.plate, w.model, w.type, w.status, w.assignedStaff, w.price, JSON.stringify(w.services), w.vehicleType, w.date]);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
    return new Response(JSON.stringify({ error: 'Inválido' }), { status: 405, headers: HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: HEADERS });
  }
}
