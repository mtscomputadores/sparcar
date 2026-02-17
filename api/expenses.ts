
export default async function handler(req: Request) {
  const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const password = "npg_Zle4yEaI6BiN";
  const host = "ep-blue-voice-aj19kiu7.c-3.us-east-2.aws.neon.tech";
  const endpoint = `https://${host}/sql`;

  const initQuery = `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT,
      description TEXT,
      amount NUMERIC,
      date TEXT,
      status TEXT,
      paymentMethod TEXT,
      installments INTEGER,
      operator TEXT,
      brand TEXT
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
      const result = await neonFetch("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 100");
      return new Response(JSON.stringify(result.rows || []), { status: 200, headers: HEADERS });
    }

    if (req.method === 'POST') {
      const e = await req.json();
      const query = `
        INSERT INTO expenses (id, category, description, amount, date, status, paymentMethod, installments, operator, brand)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET 
          amount = EXCLUDED.amount, 
          status = EXCLUDED.status, 
          description = EXCLUDED.description,
          date = EXCLUDED.date;
      `;
      const params = [e.id, e.category, e.description, e.amount, e.date, e.status, e.paymentMethod, e.installments, e.operator, e.brand];
      await neonFetch(query, params);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: HEADERS });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: HEADERS });
  }
}
