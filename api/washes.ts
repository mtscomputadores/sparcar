
export default async function handler(req: Request) {
  const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const password = "npg_Zle4yEaI6BiN";
  const host = "ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech";
  const endpoint = `https://${host}/sql`;

  const initQuery = `
    CREATE TABLE IF NOT EXISTS washes (
      id TEXT PRIMARY KEY,
      clientName TEXT NOT NULL,
      clientPhone TEXT,
      plate TEXT,
      model TEXT,
      type TEXT,
      status TEXT,
      assignedStaff TEXT,
      price NUMERIC,
      services TEXT,
      vehicleType TEXT,
      date TEXT
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
    // Garante que a tabela existe
    await neonFetch(initQuery);

    if (req.method === 'GET') {
      const result = await neonFetch("SELECT * FROM washes ORDER BY date DESC, id DESC LIMIT 100");
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const wash = await req.json();
      const query = `
        INSERT INTO washes (id, clientName, clientPhone, plate, model, type, status, assignedStaff, price, services, vehicleType, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET 
          status = EXCLUDED.status, 
          price = EXCLUDED.price, 
          clientName = EXCLUDED.clientName,
          clientPhone = EXCLUDED.clientPhone,
          plate = EXCLUDED.plate;
      `;
      const params = [wash.id, wash.clientName, wash.clientPhone, wash.plate, wash.model, wash.type, wash.status, wash.assignedStaff, wash.price, JSON.stringify(wash.services), wash.vehicleType, wash.date];
      await neonFetch(query, params);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });
  }
}
