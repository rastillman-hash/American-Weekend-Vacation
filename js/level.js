'use strict';

class Platform {
    constructor(x, y, w, h, color, accent) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.color  = color  || '#8B7355';
        this.accent = accent || '#5a4a30';
    }
    render(ctx, camX) {
        Sprites.groundTile(ctx, this.x - camX, this.y, this.w, this.h, this.color, this.accent);
    }
}

class Checkpoint {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 20; this.h = 80;
        this.activated = false;
    }
    overlapsPlayer(p) {
        return U.rectsOverlap(this.x, this.y - this.h, this.w, this.h, p.x, p.y, p.w, p.h);
    }
    activate() { this.activated = true; }
    render(ctx, camX) {
        Sprites.checkpoint(ctx, this.x - camX, this.y, this.activated);
    }
}

/* ─────────────────────────────────────────────
   Level layouts  (platforms, enemies, food, checkpoints)
   All x coords are world-space.
   Ground platform always at y = CFG.H - 40
   ──────────────────────────────────────────── */
const GROUND_Y = CFG.H - 40;
const GH = 40;  // ground height

function buildLevel(id) {
    const cfg = CFG.LEVELS[id - 1];
    const G = cfg.groundColor, A = cfg.accentColor;

    switch (id) {

    /* ── LEVEL 1: Doggy Day Care ── */
    case 1: return {
        platforms: [
            // main ground
            new Platform(0,   GROUND_Y, 3200, GH, G, A),
            // kennel platform
            new Platform(300, GROUND_Y - 80, 120, 16, '#D4AA7A', '#8B6914'),
            // fence gap jump
            new Platform(600, GROUND_Y - 60, 90, 16, '#D4AA7A', '#8B6914'),
            // mid platform chain
            new Platform(900,  GROUND_Y - 100, 140, 16, G, A),
            new Platform(1100, GROUND_Y - 60,  100, 16, G, A),
            new Platform(1350, GROUND_Y - 130, 120, 16, '#D4AA7A', '#8B6914'),
            // checkpoint area
            new Platform(1550, GROUND_Y - 80,  160, 16, G, A),
            // second half platforms
            new Platform(1900, GROUND_Y - 100, 100, 16, G, A),
            new Platform(2100, GROUND_Y - 140, 130, 16, '#D4AA7A', '#8B6914'),
            new Platform(2350, GROUND_Y - 80,  110, 16, G, A),
            new Platform(2550, GROUND_Y - 120, 100, 16, G, A),
            // boss arena
            new Platform(2700, GROUND_Y - 40,  500, 16, '#8B7355', '#5a4a30'),
        ],
        enemies: [
            createEnemy('smallDog',  380,  GROUND_Y - 28),
            createEnemy('smallDog',  700,  GROUND_Y - 28),
            createEnemy('mediumDog', 980,  GROUND_Y - 36),
            createEnemy('smallDog',  1200, GROUND_Y - 28),
            createEnemy('mediumDog', 1420, GROUND_Y - 36),
            createEnemy('smallDog',  1650, GROUND_Y - 28),
            createEnemy('smallDog',  1950, GROUND_Y - 28),
            createEnemy('mediumDog', 2150, GROUND_Y - 36),
            createEnemy('smallDog',  2400, GROUND_Y - 28),
            createEnemy('mediumDog', 2580, GROUND_Y - 36),
            // boss
            createEnemy('teenWorker', 2900, GROUND_Y - 100),
        ],
        food: [
            new Collectible(250,  GROUND_Y - 30, 'kibble'),
            new Collectible(480,  GROUND_Y - 30, 'treat'),
            new Collectible(640,  GROUND_Y - 70, 'kibble'),
            new Collectible(860,  GROUND_Y - 30, 'kibble'),
            new Collectible(1050, GROUND_Y - 30, 'treat'),
            new Collectible(1300, GROUND_Y - 110,'biscuit'),
            new Collectible(1480, GROUND_Y - 30, 'kibble'),
            new Collectible(1620, GROUND_Y - 90, 'treat'),
            new Collectible(1800, GROUND_Y - 30, 'kibble'),
            new Collectible(2000, GROUND_Y - 30, 'treat'),
            new Collectible(2200, GROUND_Y - 150,'biscuit'),
            new Collectible(2460, GROUND_Y - 30, 'kibble'),
            new Collectible(2600, GROUND_Y - 130,'treat'),
            new Collectible(2750, GROUND_Y - 50, 'hotdog'),
        ],
        checkpoints: [
            new Checkpoint(1560, GROUND_Y),
        ],
        bossSpawnX: 2900,
        exitX: 3100,
        decorations: 'daycare'
    };

    /* ── LEVEL 2: Busy Streets ── */
    case 2: return {
        platforms: [
            new Platform(0,    GROUND_Y, 3600, GH, G, A),
            // sidewalk raised sections
            new Platform(250,  GROUND_Y - 70, 100, 16, '#888', '#555'),
            new Platform(500,  GROUND_Y - 50, 80,  16, '#888', '#555'),
            new Platform(750,  GROUND_Y - 90, 120, 16, '#888', '#555'),
            new Platform(1000, GROUND_Y - 60, 90,  16, '#888', '#555'),
            // bus stop platform
            new Platform(1250, GROUND_Y - 120, 200, 20, '#4488CC', '#2255AA'),
            // checkpoint
            new Platform(1750, GROUND_Y - 70,  160, 16, '#888', '#555'),
            // second half
            new Platform(2050, GROUND_Y - 100, 100, 16, '#888', '#555'),
            new Platform(2250, GROUND_Y - 130, 120, 16, '#4488CC', '#2255AA'),
            new Platform(2500, GROUND_Y - 80,  110, 16, '#888', '#555'),
            new Platform(2750, GROUND_Y - 110, 100, 16, '#888', '#555'),
            // boss arena
            new Platform(3000, GROUND_Y - 30,  600, 20, '#777', '#444'),
        ],
        enemies: [
            createEnemy('smallDog',    350,  GROUND_Y - 28),
            createEnemy('mediumDog',   600,  GROUND_Y - 36),
            createEnemy('smallDog',    820,  GROUND_Y - 28),
            createEnemy('mediumDog',   1080, GROUND_Y - 36),
            createEnemy('smallDog',    1400, GROUND_Y - 28),
            createEnemy('mediumDog',   1550, GROUND_Y - 36),
            createEnemy('smallDog',    1900, GROUND_Y - 28),
            createEnemy('mediumDog',   2100, GROUND_Y - 36),
            createEnemy('smallDog',    2300, GROUND_Y - 28),
            createEnemy('mediumDog',   2600, GROUND_Y - 36),
            createEnemy('animalControl', 3200, GROUND_Y - 100),
        ],
        food: [
            new Collectible(200,  GROUND_Y - 30, 'kibble'),
            new Collectible(420,  GROUND_Y - 30, 'treat'),
            new Collectible(700,  GROUND_Y - 100,'biscuit'),
            new Collectible(900,  GROUND_Y - 30, 'kibble'),
            new Collectible(1150, GROUND_Y - 30, 'treat'),
            new Collectible(1320, GROUND_Y - 130,'biscuit'),
            new Collectible(1600, GROUND_Y - 30, 'kibble'),
            new Collectible(1800, GROUND_Y - 80, 'treat'),
            new Collectible(2000, GROUND_Y - 30, 'hotdog'),
            new Collectible(2200, GROUND_Y - 140,'biscuit'),
            new Collectible(2450, GROUND_Y - 30, 'kibble'),
            new Collectible(2700, GROUND_Y - 120,'treat'),
            new Collectible(2900, GROUND_Y - 30, 'hotdog'),
        ],
        checkpoints: [new Checkpoint(1760, GROUND_Y)],
        bossSpawnX: 3200,
        exitX: 3450,
        decorations: 'streets'
    };

    /* ── LEVELS 3-7: generated ── */
    default: {
        const levelW = cfg.width;
        const numEnemies = 8 + id * 2;
        const segment = levelW / (numEnemies + 2);

        const platforms = [new Platform(0, GROUND_Y, levelW, GH, G, A)];
        // Add varied platforms
        for (let i = 1; i < 10; i++) {
            const px = 200 + i * (levelW / 11);
            const py = GROUND_Y - U.rndInt(50, 150);
            const pw = U.rndInt(80, 160);
            platforms.push(new Platform(px, py, pw, 16, G, A));
        }
        // boss arena
        platforms.push(new Platform(levelW - 600, GROUND_Y - 30, 600, 20, G, A));

        const enemies = [];
        for (let i = 0; i < numEnemies - 1; i++) {
            const ex = 300 + i * segment;
            const type = i % 3 === 0 ? 'mediumDog' : 'smallDog';
            enemies.push(createEnemy(type, ex, GROUND_Y - (type === 'mediumDog' ? 36 : 28)));
        }
        enemies.push(createEnemy(cfg.bossType, levelW - 400, GROUND_Y - 100, id));

        const foodTypes = ['kibble', 'treat', 'biscuit', 'hotdog', 'burger'];
        const food = [];
        for (let i = 0; i < 16; i++) {
            const fx = 200 + i * (levelW / 17);
            const ft = foodTypes[Math.floor(Math.random() * (id < 4 ? 3 : foodTypes.length))];
            food.push(new Collectible(fx, GROUND_Y - 40, ft));
        }

        return {
            platforms,
            enemies,
            food,
            checkpoints: [new Checkpoint(Math.floor(levelW / 2), GROUND_Y)],
            bossSpawnX: levelW - 400,
            exitX: levelW - 80,
            decorations: cfg.bossType
        };
    }
    }
}

/* ─────────────────────────────────────────────
   Level class — wraps layout, handles background
   ──────────────────────────────────────────── */
class Level {
    constructor(id) {
        this.id  = id;
        this.cfg = CFG.LEVELS[id - 1];
        this.w   = this.cfg.width;

        const layout = buildLevel(id);
        this.platforms   = layout.platforms;
        this.enemies     = layout.enemies;
        this.food        = layout.food;
        this.checkpoints = layout.checkpoints;
        this.exitX       = layout.exitX;
        this.decorations = layout.decorations;

        this._stars = Array.from({ length: 80 }, () => ({
            x: Math.random() * this.w, y: Math.random() * CFG.H * 0.6,
            r: Math.random() * 1.5 + 0.5, alpha: Math.random()
        }));
        this._clouds = Array.from({ length: 12 }, () => ({
            x: Math.random() * this.w, y: Math.random() * 160 + 30,
            w: Math.random() * 120 + 60, speed: Math.random() * 0.3 + 0.1
        }));
        this._frame = 0;
        this._boss = undefined; // cached by getter
        this._skyGradient = null; // cached per level

        // scale damage / speed with level depth
        this.levelScale = 1 + (id - 1) * 0.15;
    }

    get boss() {
        if (this._boss === undefined) this._boss = this.enemies.find(e => e.isBoss) || null;
        return this._boss;
    }

    update(player) {
        this._frame++;
        // scroll clouds
        this._clouds.forEach(c => {
            c.x += c.speed;
            if (c.x - c.w > this.w) c.x = -c.w;
        });

        // update enemies
        this.enemies.forEach(e => e.update(player, this.platforms, this.levelScale));

        // update food and check collection in one pass
        this.food.forEach(f => {
            f.update();
            if (!f.collected && f.overlapsPlayer(player)) {
                player.heal(f.collect());
                player.addScore(10);
            }
        });

        // check checkpoint activation
        this.checkpoints.forEach(cp => {
            if (!cp.activated && cp.overlapsPlayer(player)) cp.activate();
        });

        // enemy attacks
        this.enemies.forEach(e => {
            if (!e.dead && e.hitsPlayer(player)) {
                const dmg = e.damage * this.levelScale;
                player.takeDamage(dmg);
            }
        });

        // player attacks enemies
        const atk = player.attackBox;
        if (atk) {
            this.enemies.forEach(e => {
                if (!e.dead && U.rectsOverlap(atk.x, atk.y, atk.w, atk.h, e.x, e.y, e.w, e.h)) {
                    const dmg = player.upgrades.bigChompers ? 30 : 15;
                    e.takeDamage(dmg);
                    if (e.dead) player.addScore(e.score);
                }
            });
        }
    }

    get allEnemiesDead() { return this.enemies.every(e => e.dead); }
    get bossDefeated()   { const b = this.boss; return b ? b.dead : false; }

    isLevelComplete(player) {
        return this.bossDefeated && player.cx > this.exitX;
    }

    getCheckpointX(player) {
        const active = this.checkpoints.filter(cp => cp.activated);
        if (active.length === 0) return 100;
        return active[active.length - 1].x;
    }

    renderBackground(ctx, camX) {
        const { skyTop, skyBottom, ambientLight } = this.cfg;
        if (!this._skyGradient) this._skyGradient = U.skyGradient(ctx, skyTop, skyBottom);
        ctx.fillStyle = this._skyGradient;
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        // stars (visible at low ambientLight)
        if (ambientLight < 0.8) {
            this._stars.forEach(s => {
                const sx = (s.x - camX * 0.1) % CFG.W;
                ctx.globalAlpha = s.alpha * (1 - ambientLight);
                ctx.beginPath(); ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = '#fff'; ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        // sun/moon
        if (ambientLight >= 0.7) {
            const sunX = CFG.W * 0.75;
            const sunY = 80;
            const grad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 40);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.3, '#FFD700');
            grad.addColorStop(1, 'rgba(255,165,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI * 2); ctx.fill();
        } else {
            // moon
            ctx.fillStyle = '#EEE8C8';
            ctx.beginPath(); ctx.arc(CFG.W * 0.8, 70, 28, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = skyTop;
            ctx.beginPath(); ctx.arc(CFG.W * 0.8 + 10, 65, 24, 0, Math.PI * 2); ctx.fill();
        }

        // neon/lights for level 7
        if (this.id === 7) {
            const t = this._frame * 0.04;
            ['#FF00FF', '#00FFFF', '#FFFF00', '#FF4400'].forEach((c, i) => {
                ctx.save();
                ctx.globalAlpha = 0.15 + 0.08 * Math.sin(t + i);
                ctx.fillStyle = c;
                ctx.fillRect(0, 0, CFG.W, CFG.H);
                ctx.restore();
            });
        }

        // clouds
        this._clouds.forEach(c => {
            const cx = c.x - camX * 0.4;
            if (cx < -c.w || cx > CFG.W + c.w) return;
            ctx.save();
            ctx.globalAlpha = 0.7 * ambientLight;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(cx, c.y, c.w / 2, 18, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx - c.w / 4, c.y + 6, c.w / 3, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + c.w / 4, c.y + 4, c.w / 3, 16, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // level-specific bg decoration
        this._drawDecorations(ctx, camX);
    }

    _drawDecorations(ctx, camX) {
        const t = this._frame;
        if (this.decorations === 'daycare') {
            // day care sign
            const sx = 100 - camX * 0.2;
            if (sx > -200 && sx < CFG.W + 100) {
                ctx.fillStyle = '#FF6B00';
                U.roundRect(ctx, sx, 60, 180, 60, 8);
                ctx.fill();
                ctx.strokeStyle = '#CC4400'; ctx.lineWidth = 3; ctx.stroke();
                U.drawText(ctx, 'HAPPY PAWS', sx + 90, 82, { size: 16, color: '#fff', outline: '#CC4400', outlineW: 2 });
                U.drawText(ctx, 'DAY CARE', sx + 90, 104, { size: 14, color: '#FFD700', outline: '#CC4400', outlineW: 2 });
            }
        } else if (this.decorations === 'streets') {
            // traffic light
            const tlx = 400 - camX * 0.3;
            if (tlx > -80 && tlx < CFG.W + 40) {
                ctx.fillStyle = '#333';
                ctx.fillRect(tlx, 30, 28, 90);
                ctx.fillStyle = '#111'; U.roundRect(ctx, tlx - 4, 24, 36, 100, 6); ctx.fill();
                const lightOn = Math.floor(t / 60) % 3;
                const lights = ['#FF0000','#FFAA00','#00FF00'];
                lights.forEach((c, i) => {
                    ctx.beginPath(); ctx.arc(tlx + 14, 50 + i * 32, 10, 0, Math.PI * 2);
                    ctx.fillStyle = lightOn === i ? c : '#333'; ctx.fill();
                });
            }
        }

        // exit sign (golden paw prints near exit)
        const ex = this.exitX - camX;
        if (ex > -100 && ex < CFG.W + 50) {
            ctx.save();
            ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 0.08);
            U.drawText(ctx, '🐾 THIS WAY!', ex - 40, GROUND_Y - 80, {
                size: 18, color: '#FFD700', outline: '#000', outlineW: 3
            });
            ctx.restore();
        }
    }

    renderForeground(ctx, camX) {
        this.platforms.forEach(p => {
            const px = p.x - camX;
            if (px > CFG.W + 100 || px + p.w < -100) return;
            p.render(ctx, camX);
        });
        this.food.forEach(f => {
            const fx = f.x - camX;
            if (fx > -50 && fx < CFG.W + 50) f.render(ctx, camX);
        });
        this.checkpoints.forEach(cp => cp.render(ctx, camX));
    }

    renderEnemies(ctx, camX) {
        this.enemies.forEach(e => {
            if (e.dead) return;
            const ex = e.cx - camX;
            if (ex > -100 && ex < CFG.W + 100) e.render(ctx, camX);
        });
    }

    renderBossHUD(ctx) {
        const b = this.boss;
        if (b && !b.dead && b.renderBossHUD) b.renderBossHUD(ctx);
    }
}
