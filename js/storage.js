'use strict';

// Storage — localStorage cache + Neon Postgres sync via /api/scores
// The game reads from localStorage (synchronous, fast, works offline).
// On page load scores are pulled from the server and merged in.
// On addScore the new entry is saved locally AND pushed to the server.

const Storage = (() => {
    const KEY = 'gb_highscores_v1';
    const MAX = 10;
    const API = '/api/scores';

    /* ── Local (sync) helpers ── */

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return { normal: [], golden: [] };
            return JSON.parse(raw);
        } catch {
            return { normal: [], golden: [] };
        }
    }

    function save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    }

    /* ── Server (async, fire-and-forget) ── */

    // Fetch server scores and merge them into localStorage so the
    // high-score table reflects the global leaderboard.
    async function syncFromServer() {
        try {
            const res = await fetch(API);
            if (!res.ok) return;
            const serverData = await res.json();

            // Merge: union of local + server, keep top MAX per mode
            const local = load();

            function merge(localList, serverList) {
                const seen = new Set();
                const combined = [...localList, ...serverList].filter(e => {
                    const key = `${e.initials}|${e.score}|${e.level}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                combined.sort((a, b) => b.score - a.score);
                return combined.slice(0, MAX);
            }

            const merged = {
                normal: merge(local.normal, serverData.normal || []),
                golden: merge(local.golden, serverData.golden || [])
            };

            save(merged);
        } catch {
            // Server unreachable — silently continue with local data
        }
    }

    // Push a single score entry to the server (best-effort).
    async function pushToServer(entry, isGolden) {
        try {
            await fetch(API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ...entry, isGolden })
            });
        } catch {
            // Offline or server error — score is still saved locally
        }
    }

    /* ── Public API (synchronous — game.js is unchanged) ── */

    function getAll() { return load(); }

    function addScore(initials, score, level, isGolden) {
        const data  = load();
        const list  = isGolden ? data.golden : data.normal;
        const entry = {
            initials: initials.toUpperCase().slice(0, 3).padEnd(3, ' '),
            score,
            level,
            date: Date.now()
        };
        list.push(entry);
        list.sort((a, b) => b.score - a.score);
        if (list.length > MAX) list.length = MAX;
        if (isGolden) data.golden = list; else data.normal = list;
        save(data);
        pushToServer(entry, isGolden); // async, fire-and-forget
    }

    function isHighScore(score, isGolden) {
        const data = load();
        const list = isGolden ? data.golden : data.normal;
        return list.length < MAX || score > (list[list.length - 1]?.score || 0);
    }

    function getRank(score, isGolden) {
        const data = load();
        const list = isGolden ? data.golden : data.normal;
        return list.filter(e => e.score > score).length + 1;
    }

    // Kick off server sync as soon as the script loads
    syncFromServer();

    return { getAll, addScore, isHighScore, getRank };
})();
