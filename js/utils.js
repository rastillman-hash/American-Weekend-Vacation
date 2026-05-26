'use strict';

const U = {
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    lerp(a, b, t)    { return a + (b - a) * t; },
    rnd(lo, hi)      { return Math.random() * (hi - lo) + lo; },
    rndInt(lo, hi)   { return Math.floor(Math.random() * (hi - lo + 1)) + lo; },

    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },

    roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    skyGradient(ctx, top, bottom) {
        const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
        g.addColorStop(0, top);
        g.addColorStop(1, bottom);
        return g;
    },

    drawStar(ctx, cx, cy, spikes, outer, inner, color) {
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outer);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
            rot += step;
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    drawText(ctx, text, x, y, opts = {}) {
        const size    = opts.size    || 24;
        const font    = opts.font    || 'Impact, sans-serif';
        const color   = opts.color   || '#fff';
        const align   = opts.align   || 'center';
        const outline = opts.outline || null;
        const outlineW= opts.outlineW|| 4;
        const shadow  = opts.shadow  || false;

        ctx.font = `${size}px ${font}`;
        ctx.textAlign = align;
        ctx.textBaseline = opts.baseline || 'middle';

        if (shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
        }
        if (outline) {
            ctx.strokeStyle = outline;
            ctx.lineWidth = outlineW;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },

    /* wobble effect - simulate hand-drawn imperfection */
    wobble(v, amt = 1.5) {
        return v + (Math.random() - 0.5) * amt;
    },

    /* scanline overlay for retro screen — uses a cached offscreen pattern */
    _scanlineCache: null,
    scanlines(ctx, w, h, alpha = 0.15) {
        if (!this._scanlineCache || this._scanlineCache.width !== w) {
            const off = document.createElement('canvas');
            off.width = w; off.height = 3;
            const octx = off.getContext('2d');
            octx.fillStyle = '#000';
            octx.fillRect(0, 0, w, 1);
            this._scanlineCache = ctx.createPattern(off, 'repeat');
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this._scanlineCache;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    },

    /* neon glow helper */
    neonText(ctx, text, x, y, size, color) {
        ctx.save();
        ctx.font = `bold ${size}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 40;
        ctx.globalAlpha = 0.5;
        ctx.fillText(text, x, y);
        ctx.restore();
    }
};
