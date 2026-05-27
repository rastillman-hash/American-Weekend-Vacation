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

    /* ── LEVEL 3: The Neighborhood ── */
    case 3: return {
        platforms: [
            // Main ground — cracked neighborhood sidewalk
            new Platform(0,    GROUND_Y, 3400, GH, G, A),
            // Picket fence top jumps (low wood sections)
            new Platform(280,  GROUND_Y - 55, 80,  12, '#D2B48C', '#8B6914'),
            new Platform(460,  GROUND_Y - 55, 80,  12, '#D2B48C', '#8B6914'),
            // Porch steps — ascending toward first house
            new Platform(700,  GROUND_Y - 50,  110, 16, '#C0A882', '#8B6914'),
            new Platform(760,  GROUND_Y - 100,  80, 16, '#C0A882', '#8B6914'),
            // Garden stone wall
            new Platform(960,  GROUND_Y - 85,  140, 16, '#9aaf7a', '#5a7a3a'),
            // Mid-section chain — rooftops / yard walls
            new Platform(1200, GROUND_Y - 120, 100, 16, '#C0A882', '#8B6914'),
            new Platform(1420, GROUND_Y - 70,  120, 16, '#9aaf7a', '#5a7a3a'),
            // Checkpoint landing — wide porch slab
            new Platform(1620, GROUND_Y - 50,  160, 20, '#C0A882', '#8B6914'),
            // Second-half platforms — deeper into Don Whiskers' turf
            new Platform(1900, GROUND_Y - 100, 110, 16, '#9aaf7a', '#5a7a3a'),
            new Platform(2110, GROUND_Y - 60,  100, 16, '#C0A882', '#8B6914'),
            new Platform(2310, GROUND_Y - 135, 130, 16, '#9aaf7a', '#5a7a3a'),
            new Platform(2560, GROUND_Y - 80,  110, 16, '#C0A882', '#8B6914'),
            new Platform(2760, GROUND_Y - 60,  100, 16, '#9aaf7a', '#5a7a3a'),
            // Boss arena — wide brick porch leading to Don Whiskers' window
            new Platform(2880, GROUND_Y - 40,  520, 20, '#C0A882', '#8B6914'),
            // Raised crate/trash-can step — lets player reach window to attack
            new Platform(3010, GROUND_Y - 110, 110, 16, '#C0A882', '#8B6914'),
        ],
        enemies: [
            // Early muscle — guard dogs in the outer yard
            createEnemy('mediumDog',  340,  GROUND_Y - 36),
            createEnemy('mediumDog',  580,  GROUND_Y - 36),
            // Don Whiskers' street-cat crew — closing in from all sides
            createEnemy('streetCat',  820,  GROUND_Y - 26),
            createEnemy('streetCat',  1060, GROUND_Y - 26),
            createEnemy('streetCat',  1260, GROUND_Y - 26),
            createEnemy('streetCat',  1480, GROUND_Y - 26),
            createEnemy('streetCat',  1720, GROUND_Y - 26),
            createEnemy('streetCat',  1960, GROUND_Y - 26),
            createEnemy('streetCat',  2160, GROUND_Y - 26),
            createEnemy('streetCat',  2420, GROUND_Y - 26),
            createEnemy('streetCat',  2640, GROUND_Y - 26),
            createEnemy('streetCat',  2820, GROUND_Y - 26),
            // Don Whiskers — fat cat mob boss, commanding from behind his window
            createEnemy('fatCatBoss', 3100, GROUND_Y - 158),
        ],
        food: [
            new Collectible(200,  GROUND_Y - 30, 'kibble'),
            new Collectible(400,  GROUND_Y - 65, 'treat'),
            new Collectible(640,  GROUND_Y - 30, 'kibble'),
            new Collectible(870,  GROUND_Y - 30, 'treat'),
            new Collectible(1010, GROUND_Y - 30, 'kibble'),
            new Collectible(1160, GROUND_Y - 130,'biscuit'),
            new Collectible(1370, GROUND_Y - 30, 'kibble'),
            new Collectible(1540, GROUND_Y - 60, 'treat'),
            new Collectible(1680, GROUND_Y - 30, 'kibble'),
            new Collectible(1870, GROUND_Y - 30, 'treat'),
            new Collectible(2080, GROUND_Y - 30, 'hotdog'),
            new Collectible(2260, GROUND_Y - 145,'biscuit'),
            new Collectible(2490, GROUND_Y - 30, 'kibble'),
            new Collectible(2700, GROUND_Y - 30, 'treat'),
            new Collectible(2840, GROUND_Y - 50, 'hotdog'),
            new Collectible(2910, GROUND_Y - 50, 'biscuit'),
        ],
        checkpoints: [new Checkpoint(1630, GROUND_Y)],
        bossSpawnX: 3100,
        exitX: 3300,
        decorations: 'neighborhood'
    };

    /* ── LEVELS 4-7: generated ── */
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
        this._bossRevealed = false; // true once boss enters the camera viewport

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
        } else if (this.decorations === 'neighborhood') {
            // Background house silhouette
            const hx = 180 - camX * 0.2;
            if (hx > -260 && hx < CFG.W + 60) {
                ctx.save();
                ctx.globalAlpha = 0.55;
                // House body
                ctx.fillStyle = '#b0c890';
                ctx.fillRect(hx, GROUND_Y - 220, 200, 180);
                // Roof (triangle)
                ctx.beginPath();
                ctx.moveTo(hx - 20, GROUND_Y - 220);
                ctx.lineTo(hx + 100, GROUND_Y - 320);
                ctx.lineTo(hx + 220, GROUND_Y - 220);
                ctx.closePath();
                ctx.fillStyle = '#7a9a5a'; ctx.fill();
                // Door
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(hx + 80, GROUND_Y - 90, 40, 50);
                // Windows
                ctx.fillStyle = '#ffe0a0';
                ctx.fillRect(hx + 20,  GROUND_Y - 180, 45, 40);
                ctx.fillRect(hx + 135, GROUND_Y - 180, 45, 40);
                ctx.restore();
            }
            // "NO DOGS ALLOWED" sign near Don Whiskers' turf
            const sx = 2780 - camX;
            if (sx > -200 && sx < CFG.W + 60) {
                // Sign post
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(sx + 55, GROUND_Y - 140, 8, 100);
                // Sign board
                ctx.fillStyle = '#CC2200';
                U.roundRect(ctx, sx, GROUND_Y - 145, 118, 50, 6);
                ctx.fill();
                ctx.strokeStyle = '#880000'; ctx.lineWidth = 3; ctx.stroke();
                // Circle-slash (no dogs)
                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(sx + 18, GROUND_Y - 120, 11, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx + 10, GROUND_Y - 128); ctx.lineTo(sx + 26, GROUND_Y - 112); ctx.stroke();
                ctx.restore();
                U.drawText(ctx, 'NO DOGS', sx + 72, GROUND_Y - 132, { size: 13, color: '#fff', outline: '#880000', outlineW: 2 });
                U.drawText(ctx, 'ALLOWED', sx + 72, GROUND_Y - 115, { size: 13, color: '#FFD700', outline: '#880000', outlineW: 2 });
            }
            // Picket fence posts in the background (parallax)
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#D2B48C';
            ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.5;
            for (let fi = 0; fi < 18; fi++) {
                const fx = (fi * 180 + 100) - camX * 0.35;
                if (fx < -20 || fx > CFG.W + 20) continue;
                // Post
                ctx.fillRect(fx, GROUND_Y - 80, 10, 80);
                // Pointed top
                ctx.beginPath();
                ctx.moveTo(fx, GROUND_Y - 80);
                ctx.lineTo(fx + 5, GROUND_Y - 96);
                ctx.lineTo(fx + 10, GROUND_Y - 80);
                ctx.closePath(); ctx.fill();
                // Rail
                ctx.fillRect(fx - 80, GROUND_Y - 68, 180, 8);
                ctx.fillRect(fx - 80, GROUND_Y - 48, 180, 8);
                ctx.strokeRect(fx, GROUND_Y - 80, 10, 80);
            }
            ctx.restore();
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
            if (ex > -100 && ex < CFG.W + 100) {
                e.render(ctx, camX);
                if (e.isBoss) this._bossRevealed = true; // latch on first sight
            }
        });
    }

    renderBossHUD(ctx) {
        const b = this.boss;
        if (b && !b.dead && b.renderBossHUD) b.renderBossHUD(ctx);
    }
}
