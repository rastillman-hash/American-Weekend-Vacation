'use strict';

const Storage = (() => {
    const KEY = 'gb_highscores_v1';
    const MAX = 10;

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

    function getAll() { return load(); }

    function addScore(initials, score, level, isGolden) {
        const data = load();
        const list = isGolden ? data.golden : data.normal;
        list.push({ initials: initials.toUpperCase().slice(0, 3).padEnd(3, ' '), score, level, date: Date.now() });
        list.sort((a, b) => b.score - a.score);
        if (list.length > MAX) list.length = MAX;
        if (isGolden) data.golden = list; else data.normal = list;
        save(data);
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

    return { getAll, addScore, isHighScore, getRank };
})();
