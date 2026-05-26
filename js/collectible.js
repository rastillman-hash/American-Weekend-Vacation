'use strict';

class Collectible {
    constructor(x, y, type) {
        const def = CFG.FOOD_TYPES.find(f => f.name === type) || CFG.FOOD_TYPES[0];
        this.x    = x;
        this.y    = y;
        this.r    = def.r;
        this.type = type;
        this.heal = def.heal;
        this.collected = false;
        this._frame = Math.floor(Math.random() * 100);
        this._popTimer = 0;
    }

    get left()   { return this.x - this.r; }
    get right()  { return this.x + this.r; }
    get top()    { return this.y - this.r; }
    get bottom() { return this.y + this.r; }

    overlapsPlayer(player) {
        return U.rectsOverlap(
            this.left, this.top, this.r * 2, this.r * 2,
            player.x, player.y, player.w, player.h
        );
    }

    collect() {
        this.collected = true;
        this._popTimer = 20;
        return this.heal;
    }

    update() {
        this._frame++;
        if (this._popTimer > 0) this._popTimer--;
    }

    render(ctx, camX) {
        if (this.collected && this._popTimer <= 0) return;
        ctx.save();
        if (this.collected) {
            const sc = 1 + (20 - this._popTimer) * 0.05;
            ctx.globalAlpha = this._popTimer / 20;
            ctx.translate(this.x - camX, this.y);
            ctx.scale(sc, sc);
            ctx.translate(-(this.x - camX), -this.y);
        }
        Sprites.food(ctx, this.x - camX, this.y, this.type, this._frame);
        ctx.restore();

        // +heal popup
        if (this.collected && this._popTimer > 0) {
            ctx.save();
            ctx.globalAlpha = this._popTimer / 20;
            U.drawText(ctx, `+${this.heal}`, this.x - camX, this.y - 20 - (20 - this._popTimer) * 1.2, {
                size: 16, color: '#00FF88', outline: '#005533', outlineW: 3
            });
            ctx.restore();
        }
    }
}
