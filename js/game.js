'use strict';

/* ════════════════════════════════════════
   GAME STATE MACHINE
   States: TITLE | PLAYING | PAUSED | UPGRADE | GAME_OVER | HIGH_SCORES | ENTER_INITIALS | VICTORY
   ════════════════════════════════════════ */

const Game = (() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = CFG.W;
    canvas.height = CFG.H;

    const input = new Input();

    /* ── State ── */
    let state      = 'TITLE';
    let levelId    = 1;
    let level      = null;
    let player     = null;
    let camX       = 0;
    let isGoldenRun= false;
    let frame      = 0;

    /* ── Upgrade select ── */
    let availableUpgrades = [];
    let upgradeIndex      = 0;
    let levelCompleteFrame= 0;

    /* ── High score entry ── */
    let pendingScore  = 0;
    let pendingLevel  = 0;
    let initials      = ['A', 'A', 'A'];
    let initialCursor = 0;

    /* ── Title screen animation ── */
    const titleAnim = { frame: 0, dogPhase: 0 };
    let _titleSkyGradient = null;

    /* ── Particle effects ── */
    const particles = [];

    /* ── Transition ── */
    let fadeAlpha    = 0;
    let fadeDir      = 0; // 1 = fade in, -1 = fade out
    let fadeCallback = null;
    let _transitioning = false; // guard against re-triggering startFade every frame

    /* ── Menu indices ── */
    let titleMenuIndex  = 0;
    let hsTabIndex      = 0; // 0 = normal, 1 = golden

    /* ── Paused ── */
    let pauseMenuIndex = 0;

    /* ══════════════════════════════════════
       HELPERS
       ══════════════════════════════════════ */

    function startFade(dir, cb) {
        fadeDir = dir;
        fadeAlpha = dir > 0 ? 0 : 1;
        fadeCallback = cb;
    }

    function spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const spd   = Math.random() * 4 + 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 2,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color,
                r: Math.random() * 5 + 2
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function renderParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });
    }

    function buildUpgradeMenu() {
        const all = CFG.UPGRADES.map(u => u.id);
        availableUpgrades = all.filter(id => !player.upgrades[id]);
        upgradeIndex = 0;
    }

    function applyUpgrade(id) {
        player.upgrades[id] = true;
    }

    function unlockAllUpgrades() {
        CFG.UPGRADES.forEach(u => { player.upgrades[u.id] = true; });
    }

    /* ══════════════════════════════════════
       LOAD LEVEL
       ══════════════════════════════════════ */
    function loadLevel(id, restoreHealth = true) {
        levelId = id;
        level   = new Level(id);
        if (!player) player = new Player(100, GROUND_Y - CFG.PLAYER_H);
        player.x = 100;
        player.y = GROUND_Y - CFG.PLAYER_H;
        if (restoreHealth) player.resetForLevel();
        camX = 0;
        particles.length = 0;
        levelCompleteFrame = 0;
        _transitioning = false;
        // golden run: all upgrades already unlocked
        if (isGoldenRun) unlockAllUpgrades();
        // level 6 start: unlock all if not golden
        if (id >= 6 && !isGoldenRun) unlockAllUpgrades();
        state = 'PLAYING';
    }

    function checkpointRespawn() {
        const cpX = level.getCheckpointX(player);
        player.x = cpX;
        player.y = GROUND_Y - CFG.PLAYER_H;
        player.vx = 0; player.vy = 0;
        player.health = Math.max(player.health, 30); // restore to at least 30
        player._invincibleTimer = CFG.INVINCIBLE_FRAMES * 2;
        particles.length = 0;
    }

    /* ══════════════════════════════════════
       UPDATE
       ══════════════════════════════════════ */
    function update() {
        frame++;
        titleAnim.frame++;

        if (fadeDir !== 0) {
            fadeAlpha = U.clamp(fadeAlpha + fadeDir * 0.04, 0, 1);
            if (fadeAlpha >= 1 && fadeDir > 0) {
                fadeDir = 0;
                if (fadeCallback) { fadeCallback(); fadeCallback = null; }
                startFade(-1, null);
            }
            if (fadeAlpha <= 0 && fadeDir < 0) { fadeDir = 0; fadeAlpha = 0; }
        }

        updateParticles();

        switch (state) {
            case 'TITLE':        updateTitle();      break;
            case 'PLAYING':      updatePlaying();    break;
            case 'PAUSED':       updatePaused();     break;
            case 'UPGRADE':      updateUpgrade();    break;
            case 'GAME_OVER':    updateGameOver();   break;
            case 'HIGH_SCORES':  updateHighScores(); break;
            case 'ENTER_INITIALS': updateInitials(); break;
            case 'VICTORY':      updateVictory();    break;
        }

        input.flush();
    }

    /* ── Title ── */
    function updateTitle() {
        const items = 3; // PLAY, HIGH SCORES, QUIT
        if (input.wasPressed(CFG.KEYS.ROLL) || input.wasPressed(['ArrowDown'])) {
            titleMenuIndex = (titleMenuIndex + 1) % items;
        }
        if (input.wasPressed(CFG.KEYS.JUMP) || input.wasPressed(['ArrowUp'])) {
            titleMenuIndex = (titleMenuIndex - 1 + items) % items;
        }
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            if (titleMenuIndex === 0) {
                startFade(1, () => {
                    isGoldenRun = false;
                    player = null;
                    loadLevel(1);
                });
            } else if (titleMenuIndex === 1) {
                state = 'HIGH_SCORES';
                hsTabIndex = 0;
            } else {
                // quit - just reload
                window.location.reload();
            }
        }
    }

    /* ── Playing ── */
    function updatePlaying() {
        if (input.wasPressed(CFG.KEYS.ESCAPE)) {
            state = 'PAUSED';
            pauseMenuIndex = 0;
            return;
        }

        player.update(input, level.platforms);
        level.update(player);

        // Camera
        const targetCam = U.clamp(player.cx - CFG.W / 3, 0, level.w - CFG.W);
        camX = U.lerp(camX, targetCam, 0.12);

        // Particles on enemy death
        level.enemies.forEach(e => {
            if (e.dead && e._hitFlash === 1) {
                spawnParticles(e.cx - camX, e.cy, '#FFD700', 16);
            }
        });

        // fell off
        if (player.y > CFG.H + 100) {
            player.takeDamage(50);
            checkpointRespawn();
        }

        // dead
        if (!player.isAlive) {
            state = 'GAME_OVER';
            return;
        }

        // level complete
        if (level.isLevelComplete(player) && !_transitioning) {
            _transitioning = true;
            spawnParticles(player.cx - camX, player.cy, '#FFD700', 30);
            if (levelId === 7) {
                startFade(1, () => { state = 'VICTORY'; _transitioning = false; });
            } else {
                player.addScore(1000 * levelId);
                buildUpgradeMenu();
                levelCompleteFrame = 0;
                _transitioning = false; // allow upgrade screen to read input
                state = 'UPGRADE';
            }
        }
    }

    /* ── Paused ── */
    function updatePaused() {
        const items = 3; // RESUME, RESTART, QUIT
        if (input.wasPressed(['ArrowDown', 's', 'S'])) pauseMenuIndex = (pauseMenuIndex + 1) % items;
        if (input.wasPressed(['ArrowUp',   'w', 'W'])) pauseMenuIndex = (pauseMenuIndex - 1 + items) % items;
        if (input.wasPressed(CFG.KEYS.ESCAPE)) { state = 'PLAYING'; return; }
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            if (pauseMenuIndex === 0) { state = 'PLAYING'; }
            else if (pauseMenuIndex === 1) {
                startFade(1, () => loadLevel(levelId));
            } else {
                startFade(1, () => { state = 'TITLE'; titleMenuIndex = 0; });
            }
        }
    }

    /* ── Upgrade select ── */
    function updateUpgrade() {
        levelCompleteFrame++;
        if (availableUpgrades.length === 0 && !_transitioning) {
            _transitioning = true;
            startFade(1, () => loadLevel(levelId + 1, false));
            return;
        }
        if (_transitioning) return;
        if (input.wasPressed(CFG.KEYS.LEFT))  upgradeIndex = (upgradeIndex - 1 + availableUpgrades.length) % availableUpgrades.length;
        if (input.wasPressed(CFG.KEYS.RIGHT)) upgradeIndex = (upgradeIndex + 1) % availableUpgrades.length;
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            applyUpgrade(availableUpgrades[upgradeIndex]);
            spawnParticles(CFG.W / 2, CFG.H / 2, '#00DDFF', 30);
            startFade(1, () => loadLevel(levelId + 1, false));
        }
    }

    /* ── Game over ── */
    function updateGameOver() {
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            // restart from checkpoint
            startFade(1, () => {
                checkpointRespawn();
                player.health = 30;
                state = 'PLAYING';
            });
        }
        if (input.wasPressed(CFG.KEYS.ESCAPE)) {
            startFade(1, () => { state = 'TITLE'; titleMenuIndex = 0; player = null; });
        }
    }

    /* ── High scores ── */
    function updateHighScores() {
        if (input.wasPressed(CFG.KEYS.LEFT) || input.wasPressed(CFG.KEYS.RIGHT)) {
            hsTabIndex = 1 - hsTabIndex;
        }
        if (input.wasPressed(CFG.KEYS.ESCAPE) || input.wasPressed(CFG.KEYS.CONFIRM)) {
            state = 'TITLE';
        }
    }

    /* ── Enter initials ── */
    function updateInitials() {
        if (input.wasPressed(['ArrowUp'])) {
            initials[initialCursor] = String.fromCharCode(
                ((initials[initialCursor].charCodeAt(0) - 65 + 1) % 26) + 65
            );
        }
        if (input.wasPressed(['ArrowDown'])) {
            initials[initialCursor] = String.fromCharCode(
                ((initials[initialCursor].charCodeAt(0) - 65 - 1 + 26) % 26) + 65
            );
        }
        if (input.wasPressed(CFG.KEYS.RIGHT) && initialCursor < 2) initialCursor++;
        if (input.wasPressed(CFG.KEYS.LEFT)  && initialCursor > 0) initialCursor--;
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            Storage.addScore(initials.join(''), pendingScore, pendingLevel, isGoldenRun);
            state = 'HIGH_SCORES';
            hsTabIndex = isGoldenRun ? 1 : 0;
        }
    }

    /* ── Victory ── */
    function updateVictory() {
        if (input.wasPressed(CFG.KEYS.CONFIRM)) {
            pendingScore = player ? player.score : 0;
            pendingLevel = 7;
            initials = ['A','A','A'];
            initialCursor = 0;
            if (Storage.isHighScore(pendingScore, isGoldenRun)) {
                state = 'ENTER_INITIALS';
            } else {
                state = 'HIGH_SCORES';
                hsTabIndex = isGoldenRun ? 1 : 0;
            }
        }
        if (input.wasPressed(['r', 'R'])) {
            // replay with golden biscuit
            startFade(1, () => {
                isGoldenRun = true;
                player = null;
                loadLevel(1);
            });
        }
    }

    /* ══════════════════════════════════════
       RENDER
       ══════════════════════════════════════ */
    function render() {
        ctx.clearRect(0, 0, CFG.W, CFG.H);

        switch (state) {
            case 'TITLE':          renderTitle();       break;
            case 'PLAYING':        renderPlaying();     break;
            case 'PAUSED':         renderPlaying(); renderPause(); break;
            case 'UPGRADE':        renderPlaying(); renderUpgrade(); break;
            case 'GAME_OVER':      renderPlaying(); renderGameOver(); break;
            case 'HIGH_SCORES':    renderHighScores();  break;
            case 'ENTER_INITIALS': renderInitials();    break;
            case 'VICTORY':        renderVictory();     break;
        }

        renderParticles();
        renderFade();
    }

    /* ── Fade overlay ── */
    function renderFade() {
        if (fadeAlpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CFG.W, CFG.H);
        ctx.restore();
    }

    /* ══════════════════════════════════════
       TITLE SCREEN  (GTA-style portrait)
       ══════════════════════════════════════ */
    function renderTitle() {
        const t = titleAnim.frame;

        /* ── Sky gradient (cached) ── */
        if (!_titleSkyGradient) {
            _titleSkyGradient = ctx.createLinearGradient(0, 0, 0, CFG.H);
            _titleSkyGradient.addColorStop(0, '#0a0020');
            _titleSkyGradient.addColorStop(0.4, '#1a0040');
            _titleSkyGradient.addColorStop(1, '#3a0060');
        }
        ctx.fillStyle = _titleSkyGradient;
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        /* ── Background mural elements ── */
        renderTitleMural(t);

        /* ── Color bands (GTA style) ── */
        ctx.save();
        ctx.globalAlpha = 0.18;
        ['#FF6B35','#FFD700','#FF4488','#00DDFF'].forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.fillRect(0, i * 135, CFG.W, 135);
        });
        ctx.restore();

        /* ── Central Biscuit hero portrait ── */
        ctx.save();
        // shadow / halo behind biscuit
        const halo = ctx.createRadialGradient(CFG.W / 2, CFG.H - 60, 30, CFG.W / 2, CFG.H - 60, 250);
        halo.addColorStop(0, 'rgba(255,215,0,0.35)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(CFG.W / 2, CFG.H - 60, 250, 0, Math.PI * 2); ctx.fill();

        // draw biscuit large in center
        ctx.scale(3.2, 3.2);
        Sprites.biscuit(ctx, CFG.W / 2 / 3.2, (CFG.H - 40) / 3.2, 1, 'idle', t, {});
        ctx.restore();

        /* ── Title text ── */
        // main title
        U.drawText(ctx, 'GOLDEN', CFG.W / 2, 82, {
            size: 88, font: 'Impact, sans-serif',
            color: '#FFD700', outline: '#000', outlineW: 8, shadow: true
        });
        U.drawText(ctx, 'BISCUIT', CFG.W / 2, 194, {
            size: 88, font: 'Impact, sans-serif',
            color: '#FF6B35', outline: '#000', outlineW: 8, shadow: true
        });

        // subtitle flicker
        if (Math.floor(t / 30) % 2 === 0) {
            U.drawText(ctx, "BISCUIT'S GREAT ESCAPE", CFG.W / 2, 278, {
                size: 18, color: '#AAA', outline: '#000', outlineW: 2
            });
        }

        /* ── Menu ── */
        const menuItems = ['▶  PLAY GAME', '🏆  HIGH SCORES', '✕  QUIT'];
        const menuY = CFG.H - 160;
        menuItems.forEach((item, i) => {
            const selected = titleMenuIndex === i;
            const pulse = selected ? 1 + Math.sin(t * 0.15) * 0.04 : 1;
            ctx.save();
            ctx.translate(CFG.W / 2, menuY + i * 46);
            ctx.scale(pulse, pulse);

            if (selected) {
                ctx.fillStyle = 'rgba(255,215,0,0.18)';
                U.roundRect(ctx, -140, -20, 280, 40, 8);
                ctx.fill();
            }
            U.drawText(ctx, item, 0, 0, {
                size: selected ? 26 : 22,
                color: selected ? '#FFD700' : '#ccc',
                outline: '#000', outlineW: 3, shadow: selected
            });
            ctx.restore();
        });

        /* ── Controls hint ── */
        U.drawText(ctx, 'Arrow keys to navigate  •  Enter / Space to select', CFG.W / 2, CFG.H - 18, {
            size: 12, color: '#666'
        });
    }

    function renderTitleMural(t) {
        /* ── 80s retro nighttime panorama — silhouettes of all 7 levels ──
           No level names in the art. Pure neon-on-dark silhouette storytelling. */
        const G = CFG.H - 8; // ground line y

        // ── Neon horizon glow bands ──
        ['#FF00FF','#00FFFF','#FF4400'].forEach((nc, i) => {
            ctx.save();
            ctx.globalAlpha = 0.04 + 0.02 * Math.sin(t * 0.04 + i * 2.1);
            ctx.fillStyle = nc;
            ctx.fillRect(0, i * 180, CFG.W, 180);
            ctx.restore();
        });

        // ── Zone 1 (x 0-155): Doggy Day Care ──
        // Main kennel building
        ctx.fillStyle = '#12082a';
        ctx.fillRect(0, G - 190, 130, 190);
        // pitched roof
        ctx.beginPath(); ctx.moveTo(-8, G - 190); ctx.lineTo(65, G - 255); ctx.lineTo(138, G - 190); ctx.closePath();
        ctx.fillStyle = '#0d0520'; ctx.fill();
        // neon sign frame (no text)
        ctx.save(); ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 18;
        ctx.strokeStyle = '#FF4400'; ctx.lineWidth = 2.5;
        ctx.strokeRect(18, G - 168, 88, 32); ctx.restore();
        // kennel window lights
        [[20, G-130, 28, 22],[84, G-130, 28, 22]].forEach(([wx,wy,ww,wh]) => {
            ctx.save(); ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255,136,0,0.28)'; ctx.fillRect(wx,wy,ww,wh); ctx.restore();
        });
        // dog-house silhouette (small, beside building)
        ctx.fillStyle = '#0d0520';
        ctx.fillRect(136, G - 55, 42, 55);
        ctx.beginPath(); ctx.moveTo(132, G-55); ctx.lineTo(157, G-80); ctx.lineTo(182, G-55); ctx.closePath();
        ctx.fillStyle = '#0a031a'; ctx.fill();
        // fence row
        ctx.fillStyle = '#100726';
        for (let fx = 142; fx < 200; fx += 16) {
            ctx.fillRect(fx, G - 44, 7, 44);
            ctx.fillRect(fx - 2, G - 38, 18, 5);
            ctx.fillRect(fx - 2, G - 24, 18, 5);
        }

        // ── Zone 2 (x 155-320): Busy Streets ──
        [[155, G-180, 52],[200, G-230, 60],[255, G-200, 55],[308, G-170, 48]].forEach(([bx,by,bw]) => {
            ctx.fillStyle = '#0e0624';
            ctx.fillRect(bx, by, bw, G - by);
            for (let wy = by + 18; wy < G - 18; wy += 26) {
                for (let wx = bx + 7; wx < bx + bw - 12; wx += 18) {
                    const on = Math.sin(t * 0.03 + wx * 0.08 + wy * 0.04) > 0;
                    if (on) {
                        ctx.save(); ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 8;
                        ctx.fillStyle = 'rgba(0,255,255,0.25)'; ctx.fillRect(wx, wy, 10, 14); ctx.restore();
                    }
                }
            }
        });
        // traffic light
        ctx.fillStyle = '#111'; ctx.fillRect(318, G - 100, 5, 100);
        const litIdx = Math.floor(t / 55) % 3;
        ['#FF0000','#FFAA00','#00FF00'].forEach((lc, i) => {
            ctx.save();
            if (litIdx === i) { ctx.shadowColor = lc; ctx.shadowBlur = 16; ctx.fillStyle = lc; }
            else { ctx.fillStyle = '#333'; }
            ctx.beginPath(); ctx.arc(320, G - 86 + i * 16, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
        // moving car silhouette
        const carX = 160 + ((t * 0.4) % 140);
        ctx.fillStyle = '#0a0318';
        ctx.fillRect(carX, G - 24, 50, 16);
        ctx.beginPath(); ctx.arc(carX + 10, G - 8, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(carX + 38, G - 8, 7, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.shadowColor = '#FF4400'; ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255,68,0,0.5)'; ctx.fillRect(carX, G - 20, 8, 8); ctx.restore();

        // ── Zone 3 (x 320-490): Neighborhood ──
        [[322, G-115, 74],[390, G-100, 82],[460, G-125, 68]].forEach(([hx,hy,hw]) => {
            ctx.fillStyle = '#0d0622';
            ctx.fillRect(hx, hy, hw, G - hy);
            ctx.beginPath(); ctx.moveTo(hx-6, hy); ctx.lineTo(hx+hw/2, hy-38); ctx.lineTo(hx+hw+6, hy); ctx.closePath();
            ctx.fillStyle = '#090418'; ctx.fill();
            ctx.save(); ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255,0,255,0.22)';
            ctx.fillRect(hx+hw/2-11, hy+18, 22, 18); ctx.restore();
        });
        // cat silhouette on fence top
        ctx.save(); ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#0a0318';
        ctx.beginPath(); ctx.arc(434, G - 54, 9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(427,G-60); ctx.lineTo(425,G-72); ctx.lineTo(433,G-63); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(435,G-63); ctx.lineTo(441,G-72); ctx.lineTo(443,G-60); ctx.closePath(); ctx.fill();
        ctx.fillRect(428, G-45, 10, 22); ctx.restore();
        // picket fence
        ctx.fillStyle = '#0c0520';
        for (let fx = 320; fx < 490; fx += 16) {
            ctx.fillRect(fx, G - 40, 6, 40);
            ctx.fillRect(fx - 2, G - 34, 18, 4);
        }

        // ── Zone 4 (x 490-630): City Park ──
        [[492, G-165, 32],[540, G-185, 40],[590, G-155, 30],[630, G-175, 36]].forEach(([tx,ty,ts]) => {
            ctx.fillStyle = '#0c0620'; ctx.fillRect(tx+ts/2-4, G-60, 8, 60);
            ctx.beginPath(); ctx.moveTo(tx-8,G-60); ctx.lineTo(tx+ts/2,ty); ctx.lineTo(tx+ts+8,G-60); ctx.closePath();
            ctx.fillStyle = '#08041a'; ctx.fill();
            ctx.save(); ctx.shadowColor = '#00FF88'; ctx.shadowBlur = 8;
            ctx.strokeStyle = 'rgba(0,255,136,0.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        });
        // lamp post
        ctx.fillStyle = '#111'; ctx.fillRect(562, G - 110, 5, 110); ctx.fillRect(562, G-110, 22, 5);
        ctx.save(); ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 22;
        ctx.fillStyle = 'rgba(255,215,0,0.65)'; ctx.beginPath(); ctx.arc(572, G-108, 7, 0, Math.PI*2); ctx.fill(); ctx.restore();
        // bench
        ctx.fillStyle = '#0c0520'; ctx.fillRect(600, G-14, 36, 5); ctx.fillRect(603, G-14, 4, 14); ctx.fillRect(629, G-14, 4, 14);

        // ── Zone 5 (x 630-780): Highway & Construction ──
        // crane mast + boom
        ctx.fillStyle = '#0e0824';
        ctx.fillRect(648, G - 230, 10, 230);
        ctx.fillRect(648, G - 230, 110, 8);
        ctx.save(); ctx.shadowColor = '#FF8C00'; ctx.shadowBlur = 12;
        ctx.strokeStyle = '#FF8C00'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(712, G-222); ctx.lineTo(720, G-110); ctx.stroke(); ctx.restore();
        // cones
        [680, 710, 742, 770].forEach(cx2 => {
            ctx.save(); ctx.shadowColor = '#FF8C00'; ctx.shadowBlur = 6;
            ctx.fillStyle = '#FF5500';
            ctx.beginPath(); ctx.moveTo(cx2,G); ctx.lineTo(cx2-7,G-26); ctx.lineTo(cx2+7,G-26); ctx.closePath(); ctx.fill();
            ctx.restore();
        });
        // road dashes
        for (let rx = 635; rx < 780; rx += 28) {
            ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 4;
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(rx, G - 6, 16, 4); ctx.restore();
        }

        // ── Zone 6 (x 780-895): Shopping Strip ──
        ctx.fillStyle = '#0c0622'; ctx.fillRect(780, G - 160, 72, 160);
        ctx.fillStyle = '#0a0418'; ctx.fillRect(846, G - 180, 66, 180);
        // neon signs (no text — pure glowing rectangles/shapes)
        [[780, G-130, 58, 24, '#FF00FF'], [846, G-148, 52, 22, '#00FFFF']].forEach(([sx,sy,sw,sh,nc]) => {
            ctx.save(); ctx.shadowColor = nc; ctx.shadowBlur = 20;
            ctx.strokeStyle = nc; ctx.lineWidth = 2.5; ctx.strokeRect(sx+4, sy, sw, sh);
            ctx.globalAlpha = 0.18; ctx.fillStyle = nc; ctx.fillRect(sx+4, sy, sw, sh);
            ctx.restore();
        });
        // striped awning accent
        ctx.save(); ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 5;
        ctx.fillStyle = '#12082a';
        ctx.beginPath(); ctx.moveTo(780,G-100); ctx.lineTo(852,G-100); ctx.lineTo(847,G-84); ctx.lineTo(785,G-84); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();

        // ── Zone 7 (x 895-960+): Wonderland Park ──
        // Ferris wheel
        ctx.save(); ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 18;
        ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(916, G - 188, 46, 0, Math.PI * 2); ctx.stroke();
        for (let sp = 0; sp < 8; sp++) {
            const ang = (sp / 8) * Math.PI * 2 + t * 0.008;
            ctx.beginPath(); ctx.moveTo(916, G-188);
            ctx.lineTo(916 + Math.cos(ang)*46, G-188 + Math.sin(ang)*46); ctx.stroke();
        }
        ctx.restore();
        // roller coaster loop — extends right beyond edge (dramatic)
        ctx.save(); ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 22;
        ctx.strokeStyle = '#FF00FF'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(974, G - 105, 58, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        // coaster track on ground
        ctx.save(); ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,0,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(895, G-8); ctx.lineTo(960, G-8); ctx.stroke(); ctx.restore();

        // ── Ground line — neon horizon ──
        ctx.save(); ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(255,0,255,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, G); ctx.lineTo(CFG.W, G); ctx.stroke(); ctx.restore();

        // ── Scanline overlay ──
        ctx.save(); ctx.globalAlpha = 0.10;
        for (let sy = 0; sy < CFG.H; sy += 3) { ctx.fillStyle = '#000'; ctx.fillRect(0, sy, CFG.W, 1); }
        ctx.restore();

        // ── Floating neon stars ──
        const neonCols = ['#FF00FF','#00FFFF','#FFD700','#FF4400','#00FF88'];
        for (let i = 0; i < 55; i++) {
            const sx = ((i * 134.7 + t * (i % 3 === 0 ? 0.15 : 0.08)) % CFG.W + CFG.W) % CFG.W;
            const sy = (i * 79.3) % (CFG.H * 0.62);
            const alpha = 0.3 + 0.5 * Math.sin(t * 0.06 + i);
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha) * 0.75;
            ctx.fillStyle = neonCols[i % neonCols.length];
            ctx.shadowColor = neonCols[i % neonCols.length]; ctx.shadowBlur = 5;
            ctx.beginPath(); ctx.arc(sx, sy, i % 4 === 0 ? 1.6 : 0.9, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    /* ══════════════════════════════════════
       GAMEPLAY SCREEN
       ══════════════════════════════════════ */
    function renderPlaying() {
        if (!level || !player) return;

        level.renderBackground(ctx, camX);
        level.renderForeground(ctx, camX);
        level.renderEnemies(ctx, camX);
        player.render(ctx, camX);

        renderHUD();

        if (level.boss && !level.boss.dead && level._bossRevealed) {
            level.renderBossHUD(ctx);
        }
    }

    function renderHUD() {
        const hp = player.health;
        const hpPct = hp / CFG.HEALTH_MAX;

        // health bar bg
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        U.roundRect(ctx, 14, 14, 220, 28, 8);
        ctx.fill();

        // health fill
        const hpColor = hpPct > 0.5 ? '#00CC44' : hpPct > 0.25 ? '#FFAA00' : '#FF2200';
        ctx.fillStyle = hpColor;
        U.roundRect(ctx, 16, 16, 216 * hpPct, 24, 6);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        U.roundRect(ctx, 16, 16, 216, 24, 6);
        ctx.stroke();

        // paw icon + label
        U.drawText(ctx, '🐾 BISCUIT', 120, 30, { size: 14, color: '#fff', outline: '#000', outlineW: 2 });

        // score
        U.drawText(ctx, `⭐ ${player.score.toLocaleString()}`, CFG.W - 16, 30, {
            size: 20, color: '#FFD700', outline: '#000', outlineW: 3, align: 'right', baseline: 'middle'
        });

        // level info
        const lcfg = CFG.LEVELS[levelId - 1];
        U.drawText(ctx, `LV ${levelId}  ${lcfg.name}`, CFG.W / 2, 20, {
            size: 14, color: '#fff', outline: '#000', outlineW: 2, baseline: 'top'
        });
        U.drawText(ctx, lcfg.timeLabel, CFG.W / 2, 36, {
            size: 11, color: '#FFD700', outline: '#000', outlineW: 2, baseline: 'top'
        });

        // upgrades panel — top-left, below health bar
        const upgs = CFG.UPGRADES.filter(u => player.upgrades[u.id]);
        upgs.forEach((u, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            U.roundRect(ctx, 14 + i * 34, 50, 28, 28, 5);
            ctx.fill();
            ctx.strokeStyle = u.color;
            ctx.lineWidth = 1.5;
            U.roundRect(ctx, 14 + i * 34, 50, 28, 28, 5);
            ctx.stroke();
            ctx.font = '15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(u.icon, 28 + i * 34, 69);
        });

        // sprint cooldown indicator — below upgrade icons
        if (player.upgrades.sprint) {
            const scPct = player.sprintCooldownPct;
            const barTop = upgs.length > 0 ? 84 : 50;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            U.roundRect(ctx, 14, barTop, 100, 10, 3);
            ctx.fill();
            ctx.fillStyle = scPct >= 1 ? '#00DDFF' : '#225566';
            U.roundRect(ctx, 14, barTop, 100 * scPct, 10, 3);
            ctx.fill();
            U.drawText(ctx, 'SPRINT', 64, barTop + 5, { size: 8, color: '#fff' });
        }

        // golden run indicator — bottom center (safe — boss banner is bottom-right weighted)
        if (isGoldenRun) {
            const glow = 0.7 + 0.3 * Math.sin(frame * 0.1);
            ctx.save();
            ctx.globalAlpha = glow;
            U.drawText(ctx, '✨ GOLDEN RUN', CFG.W / 2, CFG.H - 46, {
                size: 15, color: '#FFD700', outline: '#000', outlineW: 3
            });
            ctx.restore();
        }
    }

    /* ── Pause overlay ── */
    function renderPause() {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        // ── Banner ──
        U.drawText(ctx, 'PAUSED', CFG.W / 2, 60, {
            size: 52, color: '#FFD700', outline: '#000', outlineW: 8, shadow: true
        });
        ctx.strokeStyle = 'rgba(255,215,0,0.28)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(40, 92); ctx.lineTo(CFG.W - 40, 92); ctx.stroke();

        // ── Vertical column divider ──
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CFG.W / 2, 102); ctx.lineTo(CFG.W / 2, CFG.H - 38); ctx.stroke();

        // ─────────────── LEFT — MENU ───────────────
        const menuCX = CFG.W / 4; // 240

        U.drawText(ctx, '— MENU —', menuCX, 116, { size: 12, color: '#555' });

        const menuItems = ['RESUME', 'RESTART LEVEL', 'QUIT TO TITLE'];
        menuItems.forEach((item, i) => {
            const sel = pauseMenuIndex === i;
            const iy  = 190 + i * 72;
            if (sel) {
                ctx.fillStyle = 'rgba(255,215,0,0.13)';
                U.roundRect(ctx, menuCX - 145, iy - 26, 290, 52, 8);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,215,0,0.35)';
                ctx.lineWidth = 1.5;
                U.roundRect(ctx, menuCX - 145, iy - 26, 290, 52, 8);
                ctx.stroke();
            }
            U.drawText(ctx, sel ? `▶  ${item}` : item, menuCX, iy, {
                size: sel ? 26 : 21,
                color: sel ? '#FFD700' : '#bbb',
                outline: '#000', outlineW: 3
            });
        });

        U.drawText(ctx, '↑ ↓ / W S  navigate', menuCX, CFG.H - 52, { size: 11, color: '#555' });
        U.drawText(ctx, 'Enter  select  •  Esc  resume', menuCX, CFG.H - 32, { size: 11, color: '#555' });

        // ─────────────── RIGHT — CONTROLS ───────────────
        const ctrlCX = CFG.W * 3 / 4; // 720
        const cardX  = ctrlCX - 192;  // 528
        const cardW  = 384;
        const cardY  = 102;
        const cardH  = CFG.H - cardY - 38; // 400

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        U.roundRect(ctx, cardX, cardY, cardW, cardH, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.lineWidth = 1;
        U.roundRect(ctx, cardX, cardY, cardW, cardH, 10);
        ctx.stroke();

        U.drawText(ctx, '— CONTROLS —', ctrlCX, 116, { size: 12, color: '#555' });

        // inner column divider (action | key)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ctrlCX, cardY + 24); ctx.lineTo(ctrlCX, cardY + cardH - 22); ctx.stroke();

        // [action, keys, isUpgrade?]
        const rows = [
            ['Move',        '← →  /  A  D'],
            ['Jump',        '↑  /  W  /  Space'],
            ['Roll & Duck', '↓  /  S'],
            ['Attack',      'E'],
            ['Sprint',      'Shift',      true],
            ['Double Jump', 'Space  ×2',  true],
            ['Pause',       'Esc'],
        ];

        const rowStart = cardY + 32;
        const rowGap   = (cardH - 56) / rows.length;

        rows.forEach(([action, keys, isUpgrade], i) => {
            const ry = rowStart + i * rowGap + rowGap / 2;

            // action label — right-aligned into left half
            U.drawText(ctx, action, ctrlCX - 14, ry, {
                size: 13, color: isUpgrade ? '#998855' : '#cccccc',
                align: 'right', baseline: 'middle'
            });

            // key badge — left half of right sub-column
            const badgeW = 148, badgeH = 22;
            const badgeX = ctrlCX + 10;
            const badgeY = ry - badgeH / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            U.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
            ctx.fill();
            ctx.strokeStyle = isUpgrade ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.16)';
            ctx.lineWidth = 1;
            U.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
            ctx.stroke();
            U.drawText(ctx, keys, badgeX + badgeW / 2, ry, {
                size: 12,
                color: isUpgrade ? '#FFD700' : '#00DDFF',
                align: 'center', baseline: 'middle'
            });
        });

        // footnote
        U.drawText(ctx, '★ sprint & double jump unlock via upgrades', ctrlCX, cardY + cardH - 12, {
            size: 11, color: '#555', baseline: 'middle'
        });

        ctx.restore();
    }

    /* ── Upgrade screen ── */
    function renderUpgrade() {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        Sprites.levelComplete(ctx, levelId, levelCompleteFrame);

        if (availableUpgrades.length === 0) {
            U.drawText(ctx, 'All upgrades unlocked! Biscuit is unstoppable!', CFG.W / 2, CFG.H / 2 + 80, {
                size: 20, color: '#00FF88', outline: '#000', outlineW: 3
            });
            ctx.restore(); return;
        }

        const cardW = 180, cardH = 200;
        const totalW = availableUpgrades.length * (cardW + 20) - 20;
        const startX = (CFG.W - totalW) / 2;

        availableUpgrades.forEach((uid, i) => {
            const udef  = CFG.UPGRADES.find(u => u.id === uid);
            const sel   = upgradeIndex === i;
            const cx    = startX + i * (cardW + 20);
            const cy    = CFG.H / 2 + 20;
            const scale = sel ? 1.06 : 1;

            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cardW / 2), -(cardH / 2));

            ctx.fillStyle = sel ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.5)';
            ctx.strokeStyle = sel ? udef.color : '#555';
            ctx.lineWidth = sel ? 3 : 1.5;
            U.roundRect(ctx, 0, 0, cardW, cardH, 12);
            ctx.fill(); ctx.stroke();

            // icon
            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(udef.icon, cardW / 2, 60);

            U.drawText(ctx, udef.name, cardW / 2, 90, {
                size: 16, color: udef.color, outline: '#000', outlineW: 2
            });

            // description (word wrap)
            const words = udef.desc.split(' ');
            let line = '', lines = [], lineY = 120;
            words.forEach(w => {
                const test = line + w + ' ';
                if (test.length > 20 && line) { lines.push(line.trim()); line = w + ' '; }
                else line = test;
            });
            if (line) lines.push(line.trim());
            lines.forEach((ln, li) => {
                U.drawText(ctx, ln, cardW / 2, lineY + li * 22, { size: 13, color: '#ddd', outline: '#000', outlineW: 2 });
            });

            if (sel) {
                U.drawText(ctx, '◀ ENTER to pick ▶', cardW / 2, cardH - 18, {
                    size: 12, color: '#FFD700'
                });
            }
            ctx.restore();
        });

        U.drawText(ctx, '← → to browse  •  Enter to select upgrade', CFG.W / 2, CFG.H - 30, {
            size: 13, color: '#888'
        });
        ctx.restore();
    }

    /* ── Game over ── */
    function renderGameOver() {
        ctx.save();
        ctx.fillStyle = 'rgba(80,0,0,0.75)';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        U.drawText(ctx, 'BISCUIT DOWN!', CFG.W / 2, CFG.H / 2 - 70, {
            size: 56, color: '#FF2200', outline: '#000', outlineW: 8, shadow: true
        });

        // sad Biscuit
        ctx.save();
        ctx.scale(2, 2);
        Sprites.biscuit(ctx, CFG.W / 4, CFG.H / 2 / 2, 1, 'hurt', frame, {});
        ctx.restore();

        U.drawText(ctx, 'Enter — Retry from checkpoint', CFG.W / 2, CFG.H / 2 + 20, {
            size: 22, color: '#FFD700', outline: '#000', outlineW: 3
        });
        U.drawText(ctx, 'ESC — Quit to title', CFG.W / 2, CFG.H / 2 + 60, {
            size: 18, color: '#aaa', outline: '#000', outlineW: 2
        });
        ctx.restore();
    }

    /* ══════════════════════════════════════
       HIGH SCORES  (80s retro arcade)
       ══════════════════════════════════════ */
    function renderHighScores() {
        const t = frame;
        const isGolden = hsTabIndex === 1;

        // dark CRT bg
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        if (isGolden) {
            // golden shimmer bg
            const glow = 0.06 + 0.04 * Math.sin(t * 0.05);
            ctx.fillStyle = `rgba(255,200,0,${glow})`;
            ctx.fillRect(0, 0, CFG.W, CFG.H);
        }

        // scanlines
        U.scanlines(ctx, CFG.W, CFG.H, 0.18);

        // neon border
        const borderColor = isGolden ? '#FFD700' : '#00FFFF';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 20;
        ctx.strokeRect(10, 10, CFG.W - 20, CFG.H - 20);
        ctx.shadowBlur = 0;

        // title
        const titleText = isGolden ? '✨ GOLDEN BISCUIT LEGENDS ✨' : '🏆 HIGH SCORES 🏆';
        U.neonText(ctx, titleText, CFG.W / 2, 55, 28, isGolden ? '#FFD700' : '#00FFFF');

        // tabs
        ['NORMAL RUN', 'GOLDEN RUN'].forEach((tab, i) => {
            const sel = hsTabIndex === i;
            const tx = 260 + i * 240;
            ctx.fillStyle = sel ? (i === 1 ? '#FFD700' : '#00FFFF') : '#333';
            U.roundRect(ctx, tx - 80, 80, 160, 30, 6);
            ctx.fill();
            U.drawText(ctx, tab, tx, 96, {
                size: 14,
                color: sel ? '#000' : '#888',
                font: "'Courier New', monospace"
            });
        });
        U.drawText(ctx, '← → switch tab', CFG.W / 2, 122, {
            size: 11, color: '#444', font: "'Courier New', monospace"
        });

        // scores list
        const data  = Storage.getAll();
        const list  = isGolden ? data.golden : data.normal;
        const listY = 150;

        // header
        U.drawText(ctx, '#   NAME   SCORE       LEVEL', CFG.W / 2, listY, {
            size: 15, color: isGolden ? '#AA8800' : '#006666',
            font: "'Courier New', monospace"
        });

        if (list.length === 0) {
            U.neonText(ctx, 'NO SCORES YET!', CFG.W / 2, CFG.H / 2, 26, isGolden ? '#FFD700' : '#00FFFF');
            U.drawText(ctx, 'Play a game to set the first record!', CFG.W / 2, CFG.H / 2 + 50, {
                size: 16, color: '#555', font: "'Courier New', monospace"
            });
        } else {
            list.slice(0, 8).forEach((entry, i) => {
                const y = listY + 36 + i * 38;
                const rankColors = ['#FFD700','#CCCCCC','#CD7F32'];
                const c = i < 3 ? rankColors[i] : (isGolden ? '#AA8800' : '#006666');
                const pulse = i === 0 ? 1 + Math.sin(t * 0.1) * 0.03 : 1;

                ctx.save();
                ctx.translate(CFG.W / 2, y);
                ctx.scale(pulse, pulse);

                if (i < 3) {
                    ctx.fillStyle = `rgba(${i === 0 ? '255,215,0' : i === 1 ? '180,180,180' : '150,80,30'},0.12)`;
                    U.roundRect(ctx, -340, -18, 680, 34, 6);
                    ctx.fill();
                }

                const line = `${String(i + 1).padStart(2, ' ')}.  ${entry.initials}   ${String(entry.score).padStart(8, ' ')}    LV${entry.level}`;
                U.drawText(ctx, line, 0, 0, {
                    size: 18, color: c, outline: '#000', outlineW: 2,
                    font: "'Courier New', monospace"
                });
                ctx.restore();
            });
        }

        // Biscuit reaction based on rank
        renderBiscuitReaction(ctx, list, isGolden, t);

        U.drawText(ctx, 'Enter / ESC — Back to title', CFG.W / 2, CFG.H - 22, {
            size: 12, color: '#444', font: "'Courier New', monospace"
        });
    }

    function renderBiscuitReaction(ctx, list, isGolden, t) {
        const count = list.length;
        const bob = Math.sin(t * 0.12) * 4;
        ctx.save();
        ctx.scale(2, 2);

        const reactionState = count > 0 && count < 3 ? 'running' : 'idle';
        Sprites.biscuit(ctx, 88, (CFG.H - 30) / 2 + bob, 1, reactionState, t, {});
        ctx.restore();

        // thought bubble
        let thought = '';
        if (count === 0)      thought = 'No records yet!';
        else if (count < 3)   thought = 'Nice scores!';
        else if (count < 7)   thought = 'Can you beat me?';
        else                  thought = '...I need a treat.';

        if (isGolden) thought = '✨ Golden legend! ✨';

        if (Math.floor(t / 40) % 2 === 0) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(210, CFG.H / 2 - 40, 80, 28, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(thought, 210, CFG.H / 2 - 38);
        }
    }

    /* ══════════════════════════════════════
       INITIALS ENTRY
       ══════════════════════════════════════ */
    function renderInitials() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CFG.W, CFG.H);
        U.scanlines(ctx, CFG.W, CFG.H, 0.12);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.strokeRect(10, 10, CFG.W - 20, CFG.H - 20);
        ctx.shadowBlur = 0;

        U.neonText(ctx, 'NEW HIGH SCORE!', CFG.W / 2, 80, 36, '#FFD700');
        U.neonText(ctx, `SCORE: ${pendingScore.toLocaleString()}`, CFG.W / 2, 130, 24, '#00FFFF');

        U.drawText(ctx, 'ENTER YOUR INITIALS', CFG.W / 2, 195, {
            size: 20, color: '#fff', font: "'Courier New', monospace"
        });

        // three letter slots
        const slotW = 80, gap = 20;
        const totalW = 3 * slotW + 2 * gap;
        const startX = (CFG.W - totalW) / 2;

        initials.forEach((ch, i) => {
            const sx = startX + i * (slotW + gap);
            const sel = initialCursor === i;
            const pulse = sel ? Math.sin(frame * 0.15) > 0 : false;

            ctx.fillStyle = sel ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)';
            U.roundRect(ctx, sx, 230, slotW, 90, 10);
            ctx.fill();
            ctx.strokeStyle = sel ? '#FFD700' : '#444';
            ctx.lineWidth = sel ? 3 : 1.5;
            ctx.shadowColor = sel ? '#FFD700' : 'transparent';
            ctx.shadowBlur = sel ? 15 : 0;
            U.roundRect(ctx, sx, 230, slotW, 90, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (!(sel && pulse)) {
                U.drawText(ctx, ch, sx + slotW / 2, 278, {
                    size: 52, color: sel ? '#FFD700' : '#fff',
                    font: "'Courier New', monospace",
                    outline: '#000', outlineW: 4
                });
            }
        });

        // biscuit
        ctx.save();
        ctx.scale(1.8, 1.8);
        Sprites.biscuit(ctx, CFG.W / 2 / 1.8, 360 / 1.8, 1, 'idle', frame, {});
        ctx.restore();

        U.drawText(ctx, '↑ ↓ change letter   ← → move cursor   Enter confirm', CFG.W / 2, CFG.H - 30, {
            size: 14, color: '#666', font: "'Courier New', monospace"
        });
    }

    /* ══════════════════════════════════════
       VICTORY SCREEN
       ══════════════════════════════════════ */
    function renderVictory() {
        const t = frame;

        // dark with colorful theme park lights
        ctx.fillStyle = '#050010';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        // animated neon lights
        ['#FF00FF','#00FFFF','#FFD700','#FF4400','#00FF88'].forEach((c, i) => {
            ctx.save();
            ctx.globalAlpha = 0.08 + 0.05 * Math.sin(t * 0.06 + i * 1.2);
            ctx.fillStyle = c;
            ctx.fillRect(0, 0, CFG.W, CFG.H);
            ctx.restore();
        });

        U.scanlines(ctx, CFG.W, CFG.H, 0.08);

        // Golden biscuit
        Sprites.goldenBiscuit(ctx, CFG.W / 2, CFG.H / 2 - 60, t);

        U.drawText(ctx, '🏆 BISCUIT WINS! 🏆', CFG.W / 2, 70, {
            size: 48, color: '#FFD700', outline: '#000', outlineW: 8, shadow: true
        });
        U.drawText(ctx, 'He found his family!', CFG.W / 2, 130, {
            size: 24, color: '#FF6B35', outline: '#000', outlineW: 4
        });
        U.drawText(ctx, 'And got his peanut butter biscuit. 🐾', CFG.W / 2, 168, {
            size: 20, color: '#FFF', outline: '#000', outlineW: 3
        });

        U.drawText(ctx, `FINAL SCORE: ${player ? player.score.toLocaleString() : 0}`, CFG.W / 2, CFG.H / 2 + 80, {
            size: 28, color: '#FFD700', outline: '#000', outlineW: 4
        });

        const flashOn = Math.floor(t / 35) % 2 === 0;
        if (flashOn) {
            U.drawText(ctx, 'Press  R  to replay with the Golden Biscuit!', CFG.W / 2, CFG.H / 2 + 130, {
                size: 18, color: '#00FF88', outline: '#000', outlineW: 3
            });
        }
        U.drawText(ctx, 'Enter — Save score & view leaderboard', CFG.W / 2, CFG.H - 40, {
            size: 16, color: '#aaa', outline: '#000', outlineW: 2
        });
    }

    /* ══════════════════════════════════════
       MAIN LOOP
       ══════════════════════════════════════ */
    function loop() {
        update();
        render();
        requestAnimationFrame(loop);
    }

    /* kick off */
    requestAnimationFrame(loop);

})();
