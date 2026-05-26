'use strict';

class Enemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.health = 30;
        this.maxHealth = 30;
        this.damage = 10;
        this.score = 100;
        this.facing = -1;
        this.onGround = false;
        this.dead = false;
        this._frame = 0;
        this._hitFlash = 0;
        this._alertLevel = 0;
        this.patrolLeft = x - 80;
        this.patrolRight = x + 80;
        this.aggroRange = 200;
        this.type = 'basic';
        this.isBoss = false;
    }

    get left()   { return this.x; }
    get right()  { return this.x + this.w; }
    get top()    { return this.y; }
    get bottom() { return this.y + this.h; }
    get cx()     { return this.x + this.w / 2; }

    takeDamage(amount) {
        if (this.dead) return;
        this.health -= amount;
        this._hitFlash = 12;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
    }

    _resolveGround(platforms) {
        this.onGround = false;
        for (const p of platforms) {
            if (!U.rectsOverlap(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) continue;
            const overlapTop = (this.bottom) - p.y;
            const overlapBottom = (p.y + p.h) - this.top;
            if (overlapTop < overlapBottom && overlapTop < 20) {
                this.y = p.y - this.h;
                this.vy = 0;
                this.onGround = true;
            }
        }
    }

    update(player, platforms, levelScale = 1) {
        if (this.dead) return;
        this._frame++;
        if (this._hitFlash > 0) this._hitFlash--;
        this.vy += CFG.GRAVITY;
        if (this.vy > 20) this.vy = 20;
        this.x += this.vx;
        this.y += this.vy;
        this._resolveGround(platforms);
        this._ai(player, levelScale);
        // keep facing toward movement
        if (this.vx < 0) this.facing = -1;
        if (this.vx > 0) this.facing = 1;
    }

    _ai(player, levelScale) {
        const dist = Math.abs(player.cx - this.cx);
        if (dist < this.aggroRange) {
            this._alertLevel = dist < this.aggroRange / 2 ? 2 : 1;
            const dir = player.cx > this.cx ? 1 : -1;
            this.vx = dir * 2 * levelScale;
        } else {
            this._alertLevel = 0;
            // patrol
            if (this.cx < this.patrolLeft)  this.vx =  1.2;
            if (this.cx > this.patrolRight) this.vx = -1.2;
        }
    }

    hitsPlayer(player) {
        if (this.dead) return false;
        return U.rectsOverlap(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h);
    }

    render(ctx, camX) {
        if (this.dead) return;
        ctx.save();
        if (this._hitFlash > 0 && this._hitFlash % 3 < 2) {
            ctx.globalAlpha = 0.4;
        }
        this._draw(ctx, camX);
        ctx.restore();
        this._drawHealth(ctx, camX);
    }

    _draw(ctx, camX) {
        // override in subclasses
    }

    _drawHealth(ctx, camX) {
        if (this.isBoss) return; // boss has its own HUD
        if (this.health >= this.maxHealth) return;
        const bx = this.cx - camX - 20;
        const by = this.y - 14;
        ctx.fillStyle = '#400';
        ctx.fillRect(bx, by, 40, 6);
        ctx.fillStyle = '#0F0';
        ctx.fillRect(bx, by, 40 * (this.health / this.maxHealth), 6);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 40, 6);
    }
}

/* ── Small Dog ── */
class SmallDog extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 28);
        this.health = 20;
        this.maxHealth = 20;
        this.damage = 8;
        this.score = 75;
        this.aggroRange = 180;
        this.type = 'smallDog';
        this.patrolLeft = x - 60;
        this.patrolRight = x + 60;
    }

    _ai(player, levelScale) {
        const dist = Math.abs(player.cx - this.cx);
        if (dist < this.aggroRange) {
            this._alertLevel = 2;
            const dir = player.cx > this.cx ? 1 : -1;
            this.vx = dir * 2.5 * levelScale;
        } else {
            this._alertLevel = 0;
            if (this.cx < this.patrolLeft)  this.vx =  1.5;
            if (this.cx > this.patrolRight) this.vx = -1.5;
        }
    }

    _draw(ctx, camX) {
        Sprites.smallDog(ctx, this.cx - camX, this.bottom, this.facing, this._frame, this._alertLevel);
    }
}

/* ── Medium Dog ── */
class MediumDog extends Enemy {
    constructor(x, y) {
        super(x, y, 38, 36);
        this.health = 40;
        this.maxHealth = 40;
        this.damage = 15;
        this.score = 150;
        this.aggroRange = 250;
        this.type = 'mediumDog';
        this.patrolLeft = x - 100;
        this.patrolRight = x + 100;
    }

    _draw(ctx, camX) {
        Sprites.mediumDog(ctx, this.cx - camX, this.bottom, this.facing, this._frame, this._alertLevel);
    }
}

/* ── Teen Worker Boss ── */
class TeenWorker extends Enemy {
    constructor(x, y) {
        super(x, y, 36, 100);
        this.health = 200;
        this.maxHealth = 200;
        this.damage = 20;
        this.score = 1000;
        this.aggroRange = 400;
        this.isBoss = true;
        this.type = 'teenWorker';
        this._phase = 0;
        this._phaseTimer = 0;
        this._chargeTimer = 0;
        this._chargeActive = false;
        this.patrolLeft = x - 150;
        this.patrolRight = x + 150;
    }

    _ai(player, levelScale) {
        this._phaseTimer++;

        // phase thresholds
        if (this.health < this.maxHealth * 0.33 && this._phase < 2) this._phase = 2;
        else if (this.health < this.maxHealth * 0.66 && this._phase < 1) this._phase = 1;

        const dist = Math.abs(player.cx - this.cx);
        const dir  = player.cx > this.cx ? 1 : -1;
        const spd  = [2, 3, 4][this._phase] * levelScale;

        // charge attack every 120 frames in phase 1+
        if (this._phase >= 1 && !this._chargeActive && this._phaseTimer % 120 === 0) {
            this._chargeActive = true;
            this._chargeTimer = 30;
        }
        if (this._chargeActive) {
            this.vx = dir * 8 * levelScale;
            this._chargeTimer--;
            if (this._chargeTimer <= 0) this._chargeActive = false;
        } else {
            this.vx = dist < this.aggroRange ? dir * spd : 0;
            if (!this.vx) {
                if (this.cx < this.patrolLeft)  this.vx =  1.5;
                if (this.cx > this.patrolRight) this.vx = -1.5;
            }
        }
        this._alertLevel = this._phase;
    }

    _draw(ctx, camX) {
        Sprites.teenWorker(ctx, this.cx - camX, this.bottom, this.facing, this._frame, this._phase);
    }

    renderBossHUD(ctx) {
        const bw = 400, bh = 24;
        const bx = (CFG.W - bw) / 2, by = CFG.H - 50;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        U.roundRect(ctx, bx - 10, by - 30, bw + 20, bh + 40, 8);
        ctx.fill();
        U.drawText(ctx, 'TYLER THE TEEN', CFG.W / 2, by - 12, { size: 16, color: '#FF6B00', outline: '#000', outlineW: 3 });
        ctx.fillStyle = '#400';
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fill();
        ctx.fillStyle = '#FF4400';
        U.roundRect(ctx, bx, by, bw * (this.health / this.maxHealth), bh, 4);
        ctx.fill();
        ctx.strokeStyle = '#FF8800';
        ctx.lineWidth = 2;
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.stroke();
        // phase stars
        for (let i = 0; i < 3; i++) {
            const filled = i <= this._phase;
            U.drawStar(ctx, bx + bw + 20 + i * 22, by + 12, 5, 9, 4, filled ? '#FFD700' : '#444');
        }
    }
}

/* ── Animal Control Boss (Level 2) ── */
class AnimalControl extends Enemy {
    constructor(x, y) {
        super(x, y, 40, 100);
        this.health = 250;
        this.maxHealth = 250;
        this.damage = 25;
        this.score = 1200;
        this.aggroRange = 450;
        this.isBoss = true;
        this.type = 'animalControl';
        this._phase = 0;
        this.patrolLeft = x - 200;
        this.patrolRight = x + 200;
    }

    _ai(player, levelScale) {
        if (this.health < this.maxHealth * 0.5 && this._phase < 1) this._phase = 1;
        const dist = Math.abs(player.cx - this.cx);
        const dir = player.cx > this.cx ? 1 : -1;
        this.vx = dist < this.aggroRange ? dir * (2.5 + this._phase) * levelScale : 0;
        this._alertLevel = dist < this.aggroRange ? 1 : 0;
    }

    _draw(ctx, camX) {
        const cx = this.cx - camX;
        const cy = this.bottom;
        ctx.save();
        ctx.translate(cx, cy);
        if (this.facing < 0) ctx.scale(-1, 1);

        // legs
        ctx.fillStyle = '#3355AA';
        ctx.beginPath(); ctx.roundRect(-12, -20, 10, 20, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(2, -20, 10, 20, 3); ctx.fill();

        // body - uniform
        ctx.fillStyle = '#2244AA';
        ctx.strokeStyle = '#112288';
        ctx.lineWidth = 2;
        U.roundRect(ctx, -18, -58, 36, 40, 6);
        ctx.fill(); ctx.stroke();
        // badge
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(8, -42, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 6px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('AC', 8, -40);

        // head
        ctx.beginPath(); ctx.arc(0, -70, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#FFCC99'; ctx.fill();
        ctx.strokeStyle = '#CC9966'; ctx.lineWidth = 2; ctx.stroke();

        // cap
        ctx.fillStyle = '#2244AA';
        ctx.beginPath(); ctx.ellipse(0, -82, 18, 8, 0, 0, Math.PI); ctx.fill();
        ctx.fillRect(-14, -85, 28, 8);
        ctx.beginPath(); ctx.ellipse(0, -85, 22, 4, 0, 0, Math.PI); ctx.fill();

        // eyes
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-5, -72, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -72, 3, 0, Math.PI * 2); ctx.fill();

        // net pole
        ctx.fillStyle = '#888';
        ctx.fillRect(18, -55, 6, 50);
        // net hoop
        ctx.beginPath(); ctx.ellipse(38, -28, 16, 16, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.stroke();
        // net mesh
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(24, -28 + i * 6);
            ctx.lineTo(52, -28 + i * 6);
            ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();
        }

        ctx.restore();
    }

    renderBossHUD(ctx) {
        const bw = 400, bh = 24;
        const bx = (CFG.W - bw) / 2, by = CFG.H - 50;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        U.roundRect(ctx, bx - 10, by - 30, bw + 20, bh + 40, 8);
        ctx.fill();
        U.drawText(ctx, 'OFFICER WOOFCATCHER', CFG.W / 2, by - 12, { size: 16, color: '#4488FF', outline: '#000', outlineW: 3 });
        ctx.fillStyle = '#001a4d';
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fill();
        ctx.fillStyle = '#4488FF';
        U.roundRect(ctx, bx, by, bw * (this.health / this.maxHealth), bh, 4);
        ctx.fill();
        ctx.strokeStyle = '#88AAFF'; ctx.lineWidth = 2;
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.stroke();
    }
}

/* ── Generic placeholder boss for levels 3-7 ── */
class GenericBoss extends Enemy {
    constructor(x, y, levelId) {
        super(x, y, 44, 100);
        this.levelId = levelId;
        this.health = 200 + levelId * 50;
        this.maxHealth = this.health;
        this.damage = 15 + levelId * 5;
        this.score = 1000 + levelId * 200;
        this.aggroRange = 400;
        this.isBoss = true;
        this._phase = 0;
        this.patrolLeft = x - 180;
        this.patrolRight = x + 180;
        this._colors = ['#FF6B00','#FF4444','#228B22','#7CFC00','#FF8C00','#FFD700','#FF00FF'];
    }

    _ai(player, levelScale) {
        if (this.health < this.maxHealth * 0.5 && this._phase < 1) this._phase = 1;
        const dist = Math.abs(player.cx - this.cx);
        const dir = player.cx > this.cx ? 1 : -1;
        this.vx = dist < this.aggroRange ? dir * (2 + this._phase * 1.5) * levelScale : 0;
        if (!this.vx) {
            if (this.cx < this.patrolLeft)  this.vx = 1.5;
            if (this.cx > this.patrolRight) this.vx = -1.5;
        }
    }

    _draw(ctx, camX) {
        const cx = this.cx - camX, cy = this.bottom;
        const c = this._colors[(this.levelId - 1) % this._colors.length];
        ctx.save();
        ctx.translate(cx, cy);
        if (this.facing < 0) ctx.scale(-1, 1);

        ctx.fillStyle = '#FFCC99';
        ctx.beginPath(); ctx.roundRect(-8, -22, 16, 22, 4); ctx.fill();

        U.roundRect(ctx, -20, -66, 40, 46, 8);
        ctx.fillStyle = c; ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();

        ctx.beginPath(); ctx.arc(0, -78, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#FFCC99'; ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-5, -80, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -80, 3, 0, Math.PI * 2); ctx.fill();

        const cfg = CFG.LEVELS[this.levelId - 1];
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Impact';
        ctx.textAlign = 'center';
        ctx.fillText(cfg ? cfg.bossName.split(' ')[0] : 'BOSS', 0, -56);

        ctx.restore();
    }

    renderBossHUD(ctx) {
        const cfg = CFG.LEVELS[this.levelId - 1];
        const bw = 400, bh = 24;
        const bx = (CFG.W - bw) / 2, by = CFG.H - 50;
        const c = this._colors[(this.levelId - 1) % this._colors.length];
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        U.roundRect(ctx, bx - 10, by - 30, bw + 20, bh + 40, 8);
        ctx.fill();
        U.drawText(ctx, cfg ? cfg.bossName.toUpperCase() : 'BOSS', CFG.W / 2, by - 12,
            { size: 16, color: c, outline: '#000', outlineW: 3 });
        ctx.fillStyle = '#222';
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fill();
        ctx.fillStyle = c;
        U.roundRect(ctx, bx, by, bw * (this.health / this.maxHealth), bh, 4);
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        U.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.stroke();
    }
}

/* ── Street Cat (Level 3 standard enemy) ── */
class StreetCat extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 26);
        this.health = 25;
        this.maxHealth = 25;
        this.damage = 10;
        this.score = 80;
        this.aggroRange = 220;
        this.type = 'streetCat';
        this.patrolLeft  = x - 70;
        this.patrolRight = x + 70;
        this._lungeTimer = 0;
        this._lungeActive = false;
    }

    _ai(player, levelScale) {
        const dist = Math.abs(player.cx - this.cx);
        const dir  = player.cx > this.cx ? 1 : -1;

        if (dist < this.aggroRange) {
            this._alertLevel = dist < 80 ? 2 : 1;

            // lunge pounce when close
            if (!this._lungeActive && dist < 100 && this._lungeTimer <= 0) {
                this._lungeActive = true;
                this._lungeTimer = 25;
                this.vx = dir * 7 * levelScale;
                this.vy = -6; // pounce arc
            }
        } else {
            this._alertLevel = 0;
        }

        if (this._lungeActive) {
            this._lungeTimer--;
            if (this._lungeTimer <= 0) {
                this._lungeActive = false;
                this._lungeTimer = 60; // cooldown before next lunge
            }
        } else if (!this._lungeActive) {
            if (this._lungeTimer > 0) this._lungeTimer--;
            if (dist < this.aggroRange) {
                this.vx = dir * 2.2 * levelScale;
            } else {
                if (this.cx < this.patrolLeft)  this.vx =  1.3;
                if (this.cx > this.patrolRight) this.vx = -1.3;
            }
        }
    }

    _draw(ctx, camX) {
        Sprites.streetCat(ctx, this.cx - camX, this.bottom, this.facing, this._frame, this._alertLevel);
    }
}

/* ── Fat Cat Boss — Don Whiskers (Level 3 boss) ── */
class FatCatBoss extends Enemy {
    constructor(x, y) {
        super(x, y, 92, 158);
        this.health    = 280;
        this.maxHealth = 280;
        this.damage    = 18;
        this.score     = 1500;
        this.aggroRange= 600;
        this.isBoss    = true;
        this.type      = 'fatCatBoss';
        this._phase        = 0;
        this._phaseTimer   = 0;
        this._swipeActive  = false;
        this._swipeTimer   = 0;
        this.facing        = -1; // faces left toward the player by default
    }

    /* Boss never moves — it rules from the window */
    update(player, platforms, levelScale = 1) {
        if (this.dead) return;
        this._frame++;
        if (this._hitFlash > 0) this._hitFlash--;

        // Phase thresholds
        if (this.health < this.maxHealth * 0.33 && this._phase < 2) this._phase = 2;
        else if (this.health < this.maxHealth * 0.66 && this._phase < 1) this._phase = 1;

        this._phaseTimer++;
        this._alertLevel = this._phase;

        // Face toward the player
        this.facing = player.cx < this.cx ? -1 : 1;

        // Paw swipe attack (phase 1+) — reaches through the torn screen
        if (this._phase >= 1) {
            if (!this._swipeActive && this._phaseTimer % 80 === 0) {
                this._swipeActive = true;
                this._swipeTimer  = 35;
            }
        }
        if (this._swipeActive) {
            this._swipeTimer--;
            if (this._swipeTimer <= 0) this._swipeActive = false;
        }
    }

    hitsPlayer(player) {
        if (this.dead) return false;
        // Phase 2 paw swipe zone — reaches 80px outside the window on the player's side
        if (this._phase >= 2 && this._swipeActive) {
            const swipeX = this.facing > 0 ? this.right : this.left - 80;
            if (U.rectsOverlap(swipeX, this.y + 60, 80, 60, player.x, player.y, player.w, player.h)) return true;
        }
        // Phase 1 standard window contact (player who bumps the sill gets scratched)
        if (this._phase >= 1) {
            return U.rectsOverlap(this.x, this.y + 80, this.w, 78, player.x, player.y, player.w, player.h);
        }
        return false;
    }

    _draw(ctx, camX) {
        Sprites.fatCatBoss(ctx, this.cx - camX, this.bottom, this.facing, this._frame, this._phase);
    }

    renderBossHUD(ctx) {
        const bw = 400, bh = 24;
        const bx = (CFG.W - bw) / 2, by = CFG.H - 50;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        U.roundRect(ctx, bx - 10, by - 32, bw + 20, bh + 42, 8);
        ctx.fill();

        const phaseLabel = ['Giving Orders', 'Paw Swiping', 'CLAWS OUT!'][this._phase];
        U.drawText(ctx, `😼  DON WHISKERS — THE NEIGHBORHOOD PAW  😼`, CFG.W / 2, by - 16, {
            size: 14, color: '#FFD700', outline: '#000', outlineW: 3
        });
        U.drawText(ctx, phaseLabel, CFG.W / 2, by - 2, {
            size: 10, color: '#FF8888', outline: '#000', outlineW: 2
        });

        // health track
        ctx.fillStyle = '#1a0800';
        U.roundRect(ctx, bx, by + 10, bw, bh, 4);
        ctx.fill();
        const barColor = this._phase >= 2 ? '#FF2200' : this._phase >= 1 ? '#FF8800' : '#FF6600';
        ctx.fillStyle = barColor;
        U.roundRect(ctx, bx, by + 10, bw * (this.health / this.maxHealth), bh, 4);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        U.roundRect(ctx, bx, by + 10, bw, bh, 4);
        ctx.stroke();

        // phase paw-print pips
        for (let i = 0; i < 3; i++) {
            const filled = i <= this._phase;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(filled ? '🐾' : '○', bx + bw + 18 + i * 22, by + 24);
        }
    }
}

/* Factory */
function createEnemy(type, x, y, levelId = 1) {
    switch (type) {
        case 'smallDog':       return new SmallDog(x, y);
        case 'mediumDog':      return new MediumDog(x, y);
        case 'teenWorker':     return new TeenWorker(x, y);
        case 'animalControl':  return new AnimalControl(x, y);
        default:               return new GenericBoss(x, y, levelId);
    }
}
