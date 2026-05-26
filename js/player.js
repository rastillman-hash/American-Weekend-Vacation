'use strict';

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = CFG.PLAYER_W;
        this.h = CFG.PLAYER_H;
        this.health = CFG.HEALTH_MAX;
        this.score = 0;
        this.facing = 1;
        this.onGround = false;
        this.state = 'idle';

        this.upgrades = { sprint: false, doubleJump: false, powerDrill: false, bigChompers: false };

        this._jumpCount = 0;
        this._rollTimer = 0;
        this._attackTimer = 0;
        this._invincibleTimer = 0;
        this._sprintTimer = 0;
        this._sprintCooldown = 0;
        this._frame = 0;
        this._wasOnGround = false;
    }

    get left()   { return this.x; }
    get right()  { return this.x + this.w; }
    get top()    { return this.y; }
    get bottom() { return this.y + this.h; }
    get cx()     { return this.x + this.w / 2; }
    get cy()     { return this.y + this.h / 2; }
    get isAlive(){ return this.health > 0; }
    get isInvincible() { return this._invincibleTimer > 0; }

    get attackBox() {
        if (this._attackTimer <= 0) return null;
        const range = this.upgrades.bigChompers ? CFG.ATTACK_RANGE * 1.6 : CFG.ATTACK_RANGE;
        return {
            x: this.facing > 0 ? this.right : this.left - range,
            y: this.y + 8,
            w: range,
            h: this.h - 16
        };
    }

    update(input, platforms, dt = 1) {
        this._frame++;
        if (this._invincibleTimer > 0) this._invincibleTimer--;
        if (this._sprintCooldown > 0) this._sprintCooldown--;
        if (this._rollTimer > 0) this._rollTimer--;
        if (this._attackTimer > 0) this._attackTimer--;
        if (this._sprintTimer > 0) this._sprintTimer--;

        const rolling   = this._rollTimer > 0;
        const attacking = this._attackTimer > 0;

        // ── Horizontal movement ──
        let moveX = 0;
        let speed = CFG.PLAYER_SPEED;

        if (this._sprintTimer > 0 && this.upgrades.sprint) {
            speed = CFG.SPRINT_SPEED;
        }

        if (!rolling) {
            if (input.isDown(CFG.KEYS.LEFT))  { moveX = -1; this.facing = -1; }
            if (input.isDown(CFG.KEYS.RIGHT))  { moveX =  1; this.facing =  1; }
        } else {
            moveX = this.facing;
            speed = CFG.ROLL_SPEED;
        }

        this.vx = moveX * speed;

        // ── Jump ──
        if (input.wasPressed(CFG.KEYS.JUMP) && !rolling && !attacking) {
            if (this.onGround) {
                this.vy = CFG.JUMP_FORCE;
                this._jumpCount = 1;
                this.onGround = false;
            } else if (this.upgrades.doubleJump && this._jumpCount < 2) {
                this.vy = CFG.JUMP_FORCE * 0.9;
                this._jumpCount = 2;
            }
        }

        // ── Roll (on ground) ──
        if (input.wasPressed(CFG.KEYS.ROLL) && this.onGround && !rolling && !attacking) {
            this._rollTimer = CFG.ROLL_DURATION;
        }

        // ── Sprint burst ──
        if (input.wasPressed(CFG.KEYS.SPRINT) && this.upgrades.sprint &&
            this._sprintCooldown <= 0 && this.onGround) {
            this._sprintTimer = CFG.SPRINT_DURATION;
            this._sprintCooldown = CFG.SPRINT_COOLDOWN;
        }

        // ── Attack ──
        if (input.wasPressed(CFG.KEYS.ATTACK) && !rolling) {
            this._attackTimer = CFG.ATTACK_DURATION;
        }

        // ── Gravity ──
        this.vy += CFG.GRAVITY * dt;
        if (this.vy > 20) this.vy = 20;

        // ── Move & Collide ──
        this.x += this.vx * dt;
        this.x = Math.max(0, this.x);    // don't go off left edge

        this.y += this.vy * dt;

        this._wasOnGround = this.onGround;
        this.onGround = false;

        for (const p of platforms) {
            this._resolveCollision(p);
        }

        if (this.onGround && !this._wasOnGround) {
            this._jumpCount = 0;
        }

        // ── State ──
        this._updateState(rolling, attacking);
    }

    _resolveCollision(p) {
        if (!U.rectsOverlap(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) return;

        const overlapLeft   = (this.right)  - p.x;
        const overlapRight  = (p.x + p.w)  - this.left;
        const overlapTop    = (this.bottom) - p.y;
        const overlapBottom = (p.y + p.h)  - this.top;
        const minH = Math.min(overlapLeft, overlapRight);
        const minV = Math.min(overlapTop,  overlapBottom);

        if (minV < minH) {
            if (overlapTop < overlapBottom) {
                this.y = p.y - this.h;
                this.vy = 0;
                this.onGround = true;
            } else {
                this.y = p.y + p.h;
                if (this.vy < 0) this.vy = 0;
            }
        } else {
            if (overlapLeft < overlapRight) {
                this.x = p.x - this.w;
            } else {
                this.x = p.x + p.w;
            }
            this.vx = 0;
        }
    }

    _updateState(rolling, attacking) {
        if (!this.isAlive) { this.state = 'dead'; return; }
        if (this._invincibleTimer > CFG.INVINCIBLE_FRAMES - 20) { this.state = 'hurt'; return; }
        if (attacking) { this.state = 'attacking'; return; }
        if (rolling)   { this.state = 'rolling'; return; }
        if (this._sprintTimer > 0 && this.upgrades.sprint) { this.state = 'sprinting'; return; }
        if (!this.onGround && this._jumpCount >= 2) { this.state = 'doubleJumping'; return; }
        if (!this.onGround)  { this.state = 'jumping'; return; }
        if (this.vx !== 0)   { this.state = 'running'; return; }
        this.state = 'idle';
    }

    takeDamage(amount) {
        if (this._invincibleTimer > 0) return false;
        this.health = Math.max(0, this.health - amount);
        this._invincibleTimer = CFG.INVINCIBLE_FRAMES;
        return true;
    }

    heal(amount) {
        this.health = Math.min(CFG.HEALTH_MAX, this.health + amount);
    }

    addScore(pts) {
        this.score += pts;
    }

    resetForLevel() {
        this.health = CFG.HEALTH_MAX;
        this.vx = 0;
        this.vy = 0;
        this._jumpCount = 0;
        this._rollTimer = 0;
        this._attackTimer = 0;
        this._invincibleTimer = 0;
        this.state = 'idle';
        this.onGround = false;
    }

    get sprintCooldownPct() {
        return 1 - this._sprintCooldown / CFG.SPRINT_COOLDOWN;
    }

    render(ctx, camX) {
        Sprites.biscuit(
            ctx,
            this.cx - camX,
            this.bottom,
            this.facing,
            this.state,
            this._frame,
            this.upgrades
        );

        // debug hitbox (remove for release)
        // ctx.strokeStyle = 'red'; ctx.lineWidth = 1;
        // ctx.strokeRect(this.x - camX, this.y, this.w, this.h);

        if (this.attackBox) {
            const ab = this.attackBox;
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#FF4488';
            ctx.fillRect(ab.x - camX, ab.y, ab.w, ab.h);
            ctx.restore();
        }
    }
}
