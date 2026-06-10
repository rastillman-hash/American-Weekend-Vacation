// api/scores.js — Vercel Serverless Function
// Handles GET (fetch all scores) and POST (submit a score) backed by Neon Postgres.

const { neon } = require('@neondatabase/serverless');

async function getDb() {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
        CREATE TABLE IF NOT EXISTS highscores (
            id         SERIAL PRIMARY KEY,
            initials   CHAR(3)  NOT NULL,
            score      INTEGER  NOT NULL,
            level      INTEGER  NOT NULL,
            is_golden  BOOLEAN  NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    return sql;
}

module.exports = async function handler(req, res) {
    // CORS headers so the browser game can call this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const sql = await getDb();

        // ── GET: return top 10 normal + top 10 golden scores ──
        if (req.method === 'GET') {
            const rows = await sql`
                SELECT initials, score, level, is_golden,
                       EXTRACT(EPOCH FROM created_at) * 1000 AS date
                FROM highscores
                ORDER BY score DESC
                LIMIT 100
            `;

            const toEntry = (r) => ({
                initials: r.initials.trim(),
                score:    Number(r.score),
                level:    Number(r.level),
                date:     Number(r.date)
            });

            const normal = rows.filter(r => !r.is_golden).slice(0, 10).map(toEntry);
            const golden = rows.filter(r =>  r.is_golden).slice(0, 10).map(toEntry);

            return res.status(200).json({ normal, golden });
        }

        // ── POST: submit a new score ──
        if (req.method === 'POST') {
            const { initials, score, level, isGolden } = req.body || {};

            if (
                typeof initials !== 'string' || initials.trim().length === 0 ||
                typeof score    !== 'number' || !Number.isFinite(score)      ||
                typeof level    !== 'number' || !Number.isFinite(level)
            ) {
                return res.status(400).json({ error: 'Invalid payload' });
            }

            const clean = initials.toUpperCase().slice(0, 3).padEnd(3, ' ');

            await sql`
                INSERT INTO highscores (initials, score, level, is_golden)
                VALUES (${clean}, ${Math.round(score)}, ${Math.round(level)}, ${!!isGolden})
            `;

            return res.status(201).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
        console.error('[api/scores]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
