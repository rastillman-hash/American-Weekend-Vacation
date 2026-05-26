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
        if (input.wasPressed(['ArrowDown'])) pauseMenuIndex = (pauseMenuIndex + 1) % items;
        if (input.wasPressed(['ArrowUp']))   pauseMenuIndex = (pauseMenuIndex - 1 + items) % items;
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
        // Theme park skyline (back)
        ctx.save();
        ctx.globalAlpha = 0.25;
        [
            { x: 60,  h: 180, w: 30, c: '#FF00FF' },
            { x: 100, h: 220, w: 20, c: '#00FFFF' },
            { x: 820, h: 200, w: 25, c: '#FFD700' },
            { x: 870, h: 160, w: 35, c: '#FF4488' },
        ].forEach(b => {
            ctx.fillStyle = b.c;
            ctx.fillRect(b.x, CFG.H - b.h, b.w, b.h);
        });
        // roller coaster silhouette
        ctx.strokeStyle = '#FF4400';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(750, CFG.H - 80);
        [780,810,840,870,900].forEach((x, i) => {
            ctx.quadraticCurveTo(x - 15, CFG.H - 100 - (i % 2) * 80, x, CFG.H - 80);
        });
        ctx.stroke();
        ctx.restore();

        // day care building (left)
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FF6B00';
        ctx.fillRect(20, CFG.H - 260, 140, 260);
        ctx.fillStyle = '#D4AA00';
        ctx.font = 'bold 14px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('HAPPY PAWS', 90, CFG.H - 220);
        ctx.fillText('DAY CARE', 90, CFG.H - 200);
        ctx.restore();

        // street (mid-left)
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#555';
        ctx.fillRect(160, CFG.H - 120, 200, 120);
        // car
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(170 + Math.sin(t * 0.02) * 10, CFG.H - 70, 60, 30);
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(180, CFG.H - 40, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(220, CFG.H - 40, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // fence
        ctx.save();
        ctx.globalAlpha = 0.35;
        Sprites.fence(ctx, 370, CFG.H - 120, 130);
        ctx.restore();

        // friend dogs (right side)
        ctx.save();
        ctx.globalAlpha = 0.4;
        Sprites.smallDog(ctx, 740, CFG.H - 40, 1, t, 0);
        Sprites.mediumDog(ctx, 800, CFG.H - 40, -1, t + 20, 0);
        ctx.restore();

        // family silhouettes (far right)
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#FFD700';
        // family of 4 silhouettes
        [920, 945, 970, 985].forEach((x, i) => {
            const h = i < 2 ? 60 : 45;
            ctx.fillRect(x, CFG.H - h, 14, h);
            ctx.beginPath(); ctx.arc(x + 7, CFG.H - h - 10, 10, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();

        // animated stars scattered
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137.5) % CFG.W;
            const sy = (i * 73.1) % (CFG.H * 0.5);
            const alpha = 0.4 + 0.4 * Math.sin(t * 0.05 + i);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill();
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

        if (level.boss && !level.boss.dead) {
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

        // sprint cooldown indicator
        if (player.upgrades.sprint) {
            const scPct = player.sprintCooldownPct;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            U.roundRect(ctx, 14, 50, 100, 12, 4);
            ctx.fill();
            ctx.fillStyle = scPct >= 1 ? '#00DDFF' : '#225566';
            U.roundRect(ctx, 14, 50, 100 * scPct, 12, 4);
            ctx.fill();
            U.drawText(ctx, 'SPRINT', 64, 57, { size: 9, color: '#fff' });
        }

        // golden run indicator
        if (isGoldenRun) {
            const glow = 0.7 + 0.3 * Math.sin(frame * 0.1);
            ctx.save();
            ctx.globalAlpha = glow;
            U.drawText(ctx, '✨ GOLDEN RUN', CFG.W / 2, CFG.H - 20, {
                size: 16, color: '#FFD700', outline: '#000', outlineW: 3
            });
            ctx.restore();
        }

        // upgrades panel (small icons bottom-left)
        const upgs = CFG.UPGRADES.filter(u => player.upgrades[u.id]);
        upgs.forEach((u, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            U.roundRect(ctx, 14 + i * 36, CFG.H - 46, 30, 30, 6);
            ctx.fill();
            ctx.strokeStyle = u.color;
            ctx.lineWidth = 2;
            U.roundRect(ctx, 14 + i * 36, CFG.H - 46, 30, 30, 6);
            ctx.stroke();
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(u.icon, 29 + i * 36, CFG.H - 27);
        });
    }

    /* ── Pause overlay ── */
    function renderPause() {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, CFG.W, CFG.H);

        U.drawText(ctx, 'PAUSED', CFG.W / 2, 180, {
            size: 64, color: '#FFD700', outline: '#000', outlineW: 8, shadow: true
        });
        ['RESUME','RESTART LEVEL','QUIT TO TITLE'].forEach((item, i) => {
            const sel = pauseMenuIndex === i;
            U.drawText(ctx, item, CFG.W / 2, 290 + i * 50, {
                size: sel ? 30 : 24, color: sel ? '#FFD700' : '#ccc',
                outline: '#000', outlineW: 3
            });
        });
        U.drawText(ctx, 'ESC to resume', CFG.W / 2, CFG.H - 30, {
            size: 14, color: '#666'
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
