'use strict';

/* All drawing is relative to (cx, cy) = center-bottom (feet) of the character */

const Sprites = {

    /* ── BISCUIT ── */
    biscuit(ctx, cx, cy, facing, state, frame, upgrades = {}) {
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);

        const t = frame * 0.15;
        const run = (state === 'running' || state === 'sprinting');
        const jump = (state === 'jumping' || state === 'doubleJumping');
        const roll = (state === 'rolling');
        const attack = (state === 'attacking');
        const dig = (state === 'digging');
        const hurt = (state === 'hurt');

        if (roll) {
            // Rolling ball form
            ctx.beginPath();
            ctx.arc(0, -16, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#F5F0E8';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            // brown patches rolling
            ctx.save();
            ctx.clip();
            ctx.fillStyle = '#8B6914';
            ctx.beginPath();
            ctx.arc(6 * Math.cos(t * 4), -16 + 6 * Math.sin(t * 4), 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // eye
            ctx.beginPath();
            ctx.arc(10, -22, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
            ctx.restore();
            return;
        }

        // ── Body ──
        const bodyBob = run ? Math.sin(t * 6) * 2 : (jump ? -3 : 0);
        const bodyY = -28 + bodyBob;

        ctx.beginPath();
        U.roundRect(ctx, -14, bodyY - 10, 28, 22, 8);
        ctx.fillStyle = hurt ? '#FF8888' : '#F5F0E8';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // brown back patch
        ctx.beginPath();
        ctx.ellipse(4, bodyY - 4, 9, 7, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#8B6914';
        ctx.fill();

        // ── Tail ──
        const tailWag = run ? Math.sin(t * 8) * 15 : Math.sin(t * 3) * 8;
        ctx.save();
        ctx.translate(-14, bodyY - 2);
        ctx.rotate((tailWag * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10, -14, -6, -22);
        ctx.strokeStyle = '#F5F0E8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // ── Head ──
        const headBob = run ? Math.sin(t * 6 + 0.5) * 1.5 : 0;
        const headX = 6, headY = bodyY - 20 + headBob;

        ctx.beginPath();
        ctx.arc(headX, headY, 15, 0, Math.PI * 2);
        ctx.fillStyle = hurt ? '#FF8888' : '#F5F0E8';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Brown head patch
        ctx.beginPath();
        ctx.ellipse(headX + 2, headY - 3, 9, 7, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#8B6914';
        ctx.fill();

        // ── Ears ──
        ctx.beginPath();
        ctx.ellipse(headX + 8, headY + 5, 6, 10, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8B6914';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(headX - 6, headY + 4, 5, 9, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#F5F0E8';
        ctx.fill();
        ctx.stroke();

        // ── Eyes ──
        ctx.beginPath();
        ctx.arc(headX + 5, headY - 3, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 3, headY - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        // gleam
        ctx.beginPath();
        ctx.arc(headX + 6, headY - 4.5, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 2, headY - 4.5, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // ── Nose ──
        ctx.beginPath();
        ctx.ellipse(headX + 10, headY, 4, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        // nostrils
        ctx.beginPath();
        ctx.arc(headX + 8, headY + 1, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        // ── Mouth ──
        if (attack) {
            // big open chomp
            ctx.beginPath();
            ctx.arc(headX + 10, headY + 4, 8, 0, Math.PI);
            ctx.fillStyle = '#CC3333';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // teeth
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(headX + 4 + i * 4, headY + 4, 3, 5);
            }
            if (upgrades.bigChompers) {
                // extra big chompers glow
                ctx.shadowColor = '#FF4488';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(headX + 10, headY + 4, 12, 0, Math.PI);
                ctx.strokeStyle = '#FF4488';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        } else {
            ctx.beginPath();
            ctx.arc(headX + 10, headY + 5, 4, 0.1, Math.PI - 0.1);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // ── Legs ──
        const legSwing = run ? Math.sin(t * 8) * 10 : (jump ? -10 : 0);
        const legPairs = [
            { bx: -6, by: bodyY + 10 },
            { bx:  6, by: bodyY + 10 }
        ];
        legPairs.forEach((lp, i) => {
            const swing = (i === 0 ? legSwing : -legSwing);
            ctx.save();
            ctx.translate(lp.bx, lp.by);
            ctx.rotate((swing * Math.PI) / 180);
            ctx.beginPath();
            ctx.roundRect(-4, 0, 8, 16, 4);
            ctx.fillStyle = '#F5F0E8';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // paw
            ctx.beginPath();
            ctx.ellipse(0, 16, 5, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#E8C0A0';
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // dig animation - show drill
        if (dig && upgrades.powerDrill) {
            ctx.save();
            ctx.translate(14, bodyY + 4);
            ctx.rotate(t * 0.5);
            ctx.fillStyle = '#FF8800';
            ctx.beginPath();
            ctx.moveTo(0, -12); ctx.lineTo(4, 0); ctx.lineTo(-4, 0);
            ctx.fill();
            ctx.fillStyle = '#888';
            ctx.fillRect(-3, 0, 6, 18);
            ctx.restore();
        }

        // sprint glow
        if (state === 'sprinting' && upgrades.sprint) {
            ctx.shadowColor = '#00DDFF';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            U.roundRect(ctx, -14, bodyY - 10, 28, 22, 8);
            ctx.strokeStyle = '#00DDFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    },

    /* ── STREET CAT ENEMY ── */
    streetCat(ctx, cx, cy, facing, frame, alertLevel = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);
        const t = frame * 0.13;
        const alert = alertLevel > 0;
        const bob = alert ? Math.sin(t * 7) * 2 : 0;

        // tail
        ctx.strokeStyle = '#778899';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (alert) {
            ctx.moveTo(-10, -10 + bob);
            ctx.quadraticCurveTo(-22, -32, -10, -44 + bob);
        } else {
            ctx.moveTo(-10, -6 + bob);
            ctx.quadraticCurveTo(-22, -14, -16, -26 + bob);
        }
        ctx.stroke();

        // body
        ctx.beginPath();
        ctx.ellipse(0, -18 + bob, alert ? 10 : 13, 11, alert ? -0.4 : 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8899AA';
        ctx.fill();
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // tabby stripes
        ctx.strokeStyle = '#667788';
        ctx.lineWidth = 1.2;
        [-6, 0, 6].forEach(sx => {
            ctx.beginPath();
            ctx.moveTo(sx, -24 + bob); ctx.lineTo(sx, -13 + bob);
            ctx.stroke();
        });

        // head
        ctx.beginPath();
        ctx.ellipse(13, -26 + bob, 11, 10, 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#8899AA';
        ctx.fill();
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ears (sharp, pointy)
        ctx.fillStyle = '#8899AA';
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1.5;
        // left ear (good)
        ctx.beginPath();
        ctx.moveTo(5, -31 + bob); ctx.lineTo(8, -43 + bob); ctx.lineTo(14, -31 + bob);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // right ear (notched / battle-scarred)
        ctx.beginPath();
        ctx.moveTo(18, -31 + bob); ctx.lineTo(24, -43 + bob); ctx.lineTo(26, -33 + bob);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // notch scar
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(22, -40 + bob); ctx.lineTo(25, -36 + bob);
        ctx.stroke();
        // inner ear pink
        ctx.fillStyle = '#FFAABB';
        ctx.beginPath();
        ctx.moveTo(7, -33 + bob); ctx.lineTo(9, -40 + bob); ctx.lineTo(13, -33 + bob);
        ctx.closePath(); ctx.fill();

        // eyes (green, slitted when alert)
        const eyeH = alert ? 2 : 5;
        ctx.fillStyle = '#22CC66';
        ctx.beginPath(); ctx.ellipse(9, -28 + bob, 4, eyeH, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(17, -28 + bob, 4, eyeH, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(9, -28 + bob, alert ? 1 : 2, eyeH * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(17, -28 + bob, alert ? 1 : 2, eyeH * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        // angry brow when alert
        if (alert) {
            ctx.strokeStyle = '#334455';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(5, -33 + bob); ctx.lineTo(13, -31 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(21, -31 + bob); ctx.lineTo(13, -33 + bob); ctx.stroke();
        }

        // nose + whiskers
        ctx.fillStyle = '#FFAABB';
        ctx.beginPath(); ctx.arc(21, -24 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.8;
        [-1, 0, 1].forEach(row => {
            ctx.beginPath(); ctx.moveTo(19, -24 + row * 4 + bob); ctx.lineTo(4, -24 + row * 5 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(23, -24 + row * 4 + bob); ctx.lineTo(34, -24 + row * 5 + bob); ctx.stroke();
        });

        // hiss speech bubble when alert
        if (alert) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(28, -44 + bob, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#CC3333'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#CC3333';
            ctx.font = 'bold 8px Impact';
            ctx.textAlign = 'center';
            ctx.fillText('HSSSS!', 28, -42 + bob);
        }

        // legs
        const legSwing = alert ? Math.sin(t * 7) * 12 : 0;
        [[-7, 0], [7, 0]].forEach(([bx], i) => {
            ctx.save();
            ctx.translate(bx, -8 + bob);
            ctx.rotate(((i === 0 ? legSwing : -legSwing) * Math.PI) / 180);
            ctx.fillStyle = '#8899AA';
            ctx.beginPath(); ctx.roundRect(-3, 0, 6, 10, 3); ctx.fill();
            ctx.strokeStyle = '#556677'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.restore();
        });

        ctx.restore();
    },

    /* ── FAT CAT BOSS (Don Whiskers) — drawn in window frame ── */
    fatCatBoss(ctx, cx, cy, facing, frame, phase) {
        const t = frame * 0.05;
        ctx.save();
        ctx.translate(cx, cy);
        // Boss always faces the player (handled by caller), default left-facing
        if (facing > 0) ctx.scale(-1, 1);

        // ── House wall section ──
        ctx.fillStyle = '#D4B896';
        ctx.fillRect(-55, -168, 110, 172);
        // brick rows
        ctx.strokeStyle = '#B09070';
        ctx.lineWidth = 0.8;
        for (let row = 0; row < 6; row++) {
            const off = row % 2 === 0 ? 0 : 19;
            for (let col = -2; col < 4; col++) {
                ctx.strokeRect(-56 + col * 37 + off, -168 + row * 28, 37, 28);
            }
        }

        // ── Window outer frame ──
        ctx.fillStyle = '#EDE0C8';
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 5;
        U.roundRect(ctx, -46, -158, 92, 126, 4);
        ctx.fill(); ctx.stroke();

        // ── Interior (draw cat inside clipped area) ──
        ctx.save();
        ctx.beginPath();
        ctx.rect(-44, -156, 88, 122);
        ctx.clip();

        ctx.fillStyle = '#6B5A44';
        ctx.fillRect(-44, -156, 88, 122);
        // wallpaper pattern (elegant stripes)
        ctx.strokeStyle = '#5A4A36';
        ctx.lineWidth = 6;
        for (let wx = -44; wx < 44; wx += 14) {
            ctx.beginPath(); ctx.moveTo(wx, -156); ctx.lineTo(wx, -34); ctx.stroke();
        }

        const bodyBob = Math.sin(t * 3) * 2;

        // ── Fat cat body ──
        ctx.beginPath();
        ctx.ellipse(0, -66 + bodyBob, 34, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF4DC';
        ctx.fill();
        ctx.strokeStyle = '#D4AA64';
        ctx.lineWidth = 2;
        ctx.stroke();
        // fat rolls / chins
        ctx.strokeStyle = '#E8CC8C';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, -58 + bodyBob, 24, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -50 + bodyBob, 18, 0.3, Math.PI - 0.3); ctx.stroke();

        // ── Mob-boss bow tie ──
        const bty = -86 + bodyBob;
        ctx.fillStyle = '#CC0000';
        ctx.beginPath(); ctx.moveTo(-10, bty - 5); ctx.lineTo(0, bty); ctx.lineTo(-10, bty + 5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, bty - 5); ctx.lineTo(0, bty); ctx.lineTo(10, bty + 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#990000';
        ctx.beginPath(); ctx.arc(0, bty, 3.5, 0, Math.PI * 2); ctx.fill();

        // ── Head (very round, double-chinned) ──
        ctx.beginPath();
        ctx.arc(0, -108 + bodyBob, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF4DC';
        ctx.fill();
        ctx.strokeStyle = '#D4AA64';
        ctx.lineWidth = 2;
        ctx.stroke();
        // double chin
        ctx.beginPath();
        ctx.ellipse(0, -82 + bodyBob, 22, 12, 0, 0, Math.PI);
        ctx.fillStyle = '#FFF4DC';
        ctx.fill();

        // ── Ears ──
        [[-22, -1], [22, 1]].forEach(([ex, dir]) => {
            ctx.fillStyle = '#FFF4DC';
            ctx.strokeStyle = '#D4AA64';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ex, -124 + bodyBob);
            ctx.lineTo(ex + dir * 16, -148 + bodyBob);
            ctx.lineTo(ex + dir * 10, -124 + bodyBob);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#FFBBCC';
            ctx.beginPath();
            ctx.moveTo(ex + dir * 2, -126 + bodyBob);
            ctx.lineTo(ex + dir * 12, -143 + bodyBob);
            ctx.lineTo(ex + dir * 8, -126 + bodyBob);
            ctx.closePath(); ctx.fill();
        });

        // ── Eyes (golden, menacing, half-lidded) ──
        const eyeH = phase >= 2 ? 3 : 5;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.ellipse(-12, -110 + bodyBob, 8, eyeH, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(12, -110 + bodyBob, 8, eyeH, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(-12, -110 + bodyBob, phase >= 1 ? 1 : 3, eyeH * 0.75, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(12, -110 + bodyBob, phase >= 1 ? 1 : 3, eyeH * 0.75, 0, 0, Math.PI * 2); ctx.fill();
        // heavy upper lids (menacing)
        ctx.fillStyle = '#D4AA64';
        ctx.beginPath(); ctx.ellipse(-12, -114 + bodyBob, 9, 4, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(12, -114 + bodyBob, 9, 4, 0, Math.PI, 0); ctx.fill();

        // ── Nose ──
        ctx.fillStyle = '#FFAAAA';
        ctx.beginPath(); ctx.arc(0, -103 + bodyBob, 5, 0, Math.PI * 2); ctx.fill();

        // ── Whiskers (long, elegant) ──
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        [-5, 0, 5].forEach(dy => {
            ctx.beginPath(); ctx.moveTo(-4, -103 + dy + bodyBob); ctx.lineTo(-38, -103 + dy * 1.5 + bodyBob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(4, -103 + dy + bodyBob); ctx.lineTo(38, -103 + dy * 1.5 + bodyBob); ctx.stroke();
        });

        // ── Smug expression ──
        ctx.beginPath();
        ctx.arc(0, -96 + bodyBob, 10, 0.15, Math.PI - 0.15);
        ctx.strokeStyle = '#A07848';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ── Directing paw (phase 0: casual point; phase 1+: emphatic; phase 2: claws out) ──
        const pawSwing = Math.sin(t * 2.5) * (phase >= 1 ? 20 : 10) - 10;
        ctx.save();
        ctx.translate(-32, -72 + bodyBob);
        ctx.rotate((pawSwing * Math.PI) / 180);
        ctx.fillStyle = '#FFF4DC';
        ctx.strokeStyle = '#D4AA64';
        ctx.lineWidth = 1.5;
        // arm
        ctx.beginPath(); ctx.roundRect(-5, 0, 10, 20, 5); ctx.fill(); ctx.stroke();
        // paw
        ctx.beginPath(); ctx.arc(-1, 24, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // claws (always visible on the boss - just extended further in phase 2)
        const clawLen = phase >= 2 ? 14 : 7;
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.2;
        for (let c = 0; c < 4; c++) {
            const ang = ((c / 3.5) - 0.5) * Math.PI * 0.9;
            ctx.beginPath();
            ctx.moveTo(-1 + Math.cos(ang) * 7, 24 + Math.sin(ang) * 7);
            ctx.lineTo(-1 + Math.cos(ang) * (7 + clawLen), 24 + Math.sin(ang) * (7 + clawLen));
            ctx.stroke();
        }
        ctx.restore();

        // ── Speech bubble (directing cats) ──
        if (phase >= 0) {
            const phrases = [['GET HIM!', 'BOYS GO!'], ['SURROUND', 'HIM NOW!'], ['DESTROY', 'THAT DOG!']];
            const p = phrases[Math.min(phase, 2)];
            const bubbleVisible = Math.floor(t * 20) % 60 < 40;
            if (bubbleVisible) {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.ellipse(36, -140 + bodyBob, 28, 18, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#CC0000'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#CC0000';
                ctx.font = 'bold 7px Impact';
                ctx.textAlign = 'center';
                ctx.fillText(p[0], 36, -145 + bodyBob);
                ctx.fillText(p[1], 36, -135 + bodyBob);
            }
        }

        ctx.restore(); // end interior clip

        // ── Window screen mesh ──
        if (phase < 2) {
            // intact screen
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#667';
            ctx.lineWidth = 0.7;
            for (let gx = -44; gx <= 44; gx += 9) {
                ctx.beginPath(); ctx.moveTo(gx, -156); ctx.lineTo(gx, -34); ctx.stroke();
            }
            for (let gy = -156; gy <= -34; gy += 9) {
                ctx.beginPath(); ctx.moveTo(-44, gy); ctx.lineTo(44, gy); ctx.stroke();
            }
            ctx.restore();
        } else {
            // torn screen — ragged strips hanging down
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#889';
            ctx.lineWidth = 0.8;
            const tears = [-38, -22, -6, 10, 26, 40];
            tears.forEach((gx, i) => {
                const tearY = -156 + 20 + (i % 3) * 15;
                ctx.beginPath(); ctx.moveTo(gx, -156); ctx.lineTo(gx + U.rnd(-4, 4), tearY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(gx, tearY); ctx.lineTo(gx + U.rnd(-6, 6), tearY + 35 + (i % 2) * 20); ctx.stroke();
            });
            ctx.restore();
            // red eyes glow through torn screen in phase 2
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath(); ctx.arc(-12, -110 + Math.sin(t * 3) * 2, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(12, -110 + Math.sin(t * 3) * 2, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // ── Window cross-bars ──
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-4, -156, 8, 122);     // vertical divider
        ctx.fillRect(-44, -100, 88, 8);     // horizontal divider

        // ── Window sill & nameplate ──
        ctx.fillStyle = '#A07848';
        U.roundRect(ctx, -52, -34, 104, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#7A5828';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 7px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('DON WHISKERS', 0, -24);

        // ── Phase 2: paw swiping through torn screen ──
        if (phase >= 2 && Math.sin(t * 4) > 0.3) {
            const swipeX = Math.sin(t * 4) * 20 - 30;
            ctx.save();
            ctx.translate(swipeX, -70);
            ctx.fillStyle = '#FFF4DC';
            ctx.strokeStyle = '#D4AA64';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1.5;
            for (let c = 0; c < 5; c++) {
                const ang = ((c / 4.5) - 0.5) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * 11, Math.sin(ang) * 11);
                ctx.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    },

    /* ── SMALL DOG ENEMY ── */
    smallDog(ctx, cx, cy, facing, frame, alertLevel = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);
        const t = frame * 0.15;
        const run = alertLevel > 0;
        const bob = run ? Math.sin(t * 8) * 2 : 0;

        // body
        ctx.beginPath();
        U.roundRect(ctx, -12, -22 + bob, 24, 16, 6);
        ctx.fillStyle = '#C8A464';
        ctx.fill();
        ctx.strokeStyle = '#5a3a0a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // head
        ctx.beginPath();
        ctx.arc(10, -28 + bob, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#C8A464';
        ctx.fill();
        ctx.strokeStyle = '#5a3a0a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ears (floppy)
        ctx.beginPath();
        ctx.ellipse(14, -22 + bob, 5, 9, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#A07832';
        ctx.fill();
        ctx.stroke();

        // eyes - angry when alert
        const eyeColor = alertLevel > 1 ? '#FF0000' : '#222';
        ctx.beginPath();
        ctx.arc(14, -30 + bob, 3, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor;
        ctx.fill();
        if (alertLevel > 1) {
            ctx.beginPath();
            ctx.moveTo(10, -33 + bob); ctx.lineTo(18, -31 + bob);
            ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 2; ctx.stroke();
        }

        // nose
        ctx.beginPath();
        ctx.ellipse(20, -28 + bob, 3, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill();

        // legs
        const swing = run ? Math.sin(t * 8) * 12 : 0;
        [[-7, 0], [5, 0]].forEach(([bx], i) => {
            ctx.save();
            ctx.translate(bx, -8 + bob);
            ctx.rotate(((i === 0 ? swing : -swing) * Math.PI) / 180);
            ctx.fillStyle = '#C8A464';
            ctx.beginPath(); ctx.roundRect(-3, 0, 6, 12, 3); ctx.fill();
            ctx.strokeStyle = '#5a3a0a'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        });

        // angry speech bubble
        if (alertLevel > 1) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(22, -42 + bob, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ARF!', 22, -42 + bob + 3);
        }
        ctx.restore();
    },

    /* ── MEDIUM DOG ENEMY ── */
    mediumDog(ctx, cx, cy, facing, frame, alertLevel = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);
        const t = frame * 0.12;
        const bob = alertLevel > 0 ? Math.sin(t * 7) * 3 : 0;

        ctx.beginPath();
        U.roundRect(ctx, -16, -26 + bob, 32, 20, 8);
        ctx.fillStyle = '#7A5230';
        ctx.fill();
        ctx.strokeStyle = '#3a2010';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(12, -34 + bob, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#7A5230';
        ctx.fill();
        ctx.strokeStyle = '#3a2010';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(18, -25 + bob, 6, 11, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#5a3010';
        ctx.fill();
        ctx.stroke();

        const eyeColor = alertLevel > 0 ? '#FF2200' : '#222';
        ctx.beginPath();
        ctx.arc(16, -36 + bob, 4, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor; ctx.fill();

        if (alertLevel > 0) {
            ctx.beginPath();
            ctx.moveTo(11, -40 + bob); ctx.lineTo(21, -38 + bob);
            ctx.strokeStyle = '#FF2200'; ctx.lineWidth = 2.5; ctx.stroke();
        }

        ctx.beginPath();
        ctx.ellipse(24, -34 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill();

        const swing = alertLevel > 0 ? Math.sin(t * 7) * 14 : 0;
        [[-9, 0], [7, 0]].forEach(([bx], i) => {
            ctx.save();
            ctx.translate(bx, -8 + bob);
            ctx.rotate(((i === 0 ? swing : -swing) * Math.PI) / 180);
            ctx.fillStyle = '#7A5230';
            ctx.beginPath(); ctx.roundRect(-4, 0, 8, 14, 4); ctx.fill();
            ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        });
        ctx.restore();
    },

    /* ── TEEN WORKER BOSS (Level 1) ── */
    teenWorker(ctx, cx, cy, facing, frame, phase = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);
        const t = frame * 0.1;
        const bob = Math.sin(t * 4) * 2;

        // legs
        const legSwing = Math.sin(t * 5) * 10;
        [[-8, 0], [8, 0]].forEach(([bx], i) => {
            ctx.save();
            ctx.translate(bx, -14 + bob);
            ctx.rotate(((i === 0 ? legSwing : -legSwing) * Math.PI) / 180);
            ctx.fillStyle = '#3355AA';
            ctx.beginPath(); ctx.roundRect(-6, 0, 12, 28, 4); ctx.fill();
            ctx.strokeStyle = '#223388'; ctx.lineWidth = 2; ctx.stroke();
            // sneaker
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.roundRect(-7, 26, 14, 8, 3); ctx.fill();
            ctx.strokeStyle = '#aaa'; ctx.stroke();
            ctx.restore();
        });

        // torso (day care shirt - bright orange)
        ctx.beginPath();
        U.roundRect(ctx, -18, -52 + bob, 36, 40, 6);
        ctx.fillStyle = '#FF6B00';
        ctx.fill();
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // shirt text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('STAFF', 0, -32 + bob);

        // arms
        const armSwing = Math.sin(t * 5) * 15;
        [[-20, -45], [20, -45]].forEach(([ax, ay], i) => {
            ctx.save();
            ctx.translate(ax, ay + bob);
            ctx.rotate(((i === 0 ? -armSwing : armSwing) * Math.PI) / 180);
            ctx.fillStyle = '#FFCC99';
            ctx.beginPath(); ctx.roundRect(-5, 0, 10, 28, 4); ctx.fill();
            ctx.strokeStyle = '#CC9966'; ctx.lineWidth = 1.5; ctx.stroke();
            // hand
            ctx.beginPath(); ctx.arc(0, 28, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#FFCC99'; ctx.fill(); ctx.stroke();

            // phase 1: holding leash/broom; phase 2: walkie-talkie
            if (phase >= 1 && i === 1) {
                ctx.fillStyle = '#888';
                ctx.fillRect(-3, 28, 6, 22);
                ctx.fillStyle = '#FF6B00';
                ctx.beginPath(); ctx.arc(0, 28, 4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });

        // head
        ctx.beginPath();
        ctx.arc(0, -64 + bob, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#FFCC99';
        ctx.fill();
        ctx.strokeStyle = '#CC9966';
        ctx.lineWidth = 2;
        ctx.stroke();

        // hair (messy teen)
        ctx.fillStyle = '#5a3010';
        ctx.beginPath();
        ctx.ellipse(0, -78 + bob, 18, 10, 0, 0, Math.PI);
        ctx.fill();
        // messy strands
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5, -77 + bob);
            ctx.quadraticCurveTo(i * 5 + U.rnd(-3, 3), -90 + bob, i * 5 + U.rnd(-5, 5), -95 + bob);
            ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 3; ctx.stroke();
        }

        // eyes (annoyed)
        ctx.beginPath(); ctx.arc(-7, -65 + bob, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#222'; ctx.fill();
        ctx.beginPath(); ctx.arc(7, -65 + bob, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#222'; ctx.fill();
        // annoyed eyebrows
        ctx.beginPath();
        ctx.moveTo(-12, -71 + bob); ctx.lineTo(-3, -69 + bob);
        ctx.moveTo(3, -69 + bob);  ctx.lineTo(12, -71 + bob);
        ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 2.5; ctx.stroke();

        // mouth (grumpy)
        ctx.beginPath();
        ctx.arc(0, -60 + bob, 6, 0.3, Math.PI - 0.3, true);
        ctx.strokeStyle = '#AA6644'; ctx.lineWidth = 2; ctx.stroke();

        // phase 2+ : yelling speech bubble
        if (phase >= 2) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(40, -88 + bob, 28, 16, -0.2, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 8px Impact';
            ctx.textAlign = 'center';
            ctx.fillText('GET BACK', 40, -91 + bob);
            ctx.fillText('HERE!!', 40, -82 + bob);
        }

        ctx.restore();
    },

    /* ── FOOD / COLLECTIBLE ── */
    food(ctx, cx, cy, type, frame) {
        const t = frame * 0.08;
        const bob = Math.sin(t * 4) * 3;
        const ft = CFG.FOOD_TYPES.find(f => f.name === type) || CFG.FOOD_TYPES[0];

        ctx.save();
        ctx.translate(cx, cy + bob);

        if (type === 'biscuit' || type === 'treat') {
            // bone / biscuit shape
            ctx.beginPath();
            ctx.ellipse(0, 0, ft.r, ft.r * 0.7, 0, 0, Math.PI * 2);
            ctx.fillStyle = ft.color;
            ctx.fill();
            ctx.strokeStyle = ft.outline;
            ctx.lineWidth = 2;
            ctx.stroke();
            // bone ends
            [-ft.r - 2, ft.r + 2].forEach(bx => {
                ctx.beginPath();
                ctx.arc(bx, -3, 4, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.arc(bx, 3, 4, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            });
        } else if (type === 'kibble') {
            ctx.beginPath();
            ctx.arc(0, 0, ft.r, 0, Math.PI * 2);
            ctx.fillStyle = ft.color;
            ctx.fill();
            ctx.strokeStyle = ft.outline;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (type === 'hotdog') {
            ctx.beginPath();
            ctx.ellipse(0, 0, ft.r + 3, ft.r - 2, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD080';
            ctx.fill();
            ctx.strokeStyle = '#C88000'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 1, ft.r, ft.r - 4, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = ft.color; ctx.fill();
        } else if (type === 'burger') {
            // bun top
            ctx.beginPath(); ctx.ellipse(0, -4, ft.r, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#D4A050'; ctx.fill();
            ctx.strokeStyle = ft.outline; ctx.lineWidth = 2; ctx.stroke();
            // patty
            ctx.beginPath(); ctx.ellipse(0, 2, ft.r + 2, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#6B3010'; ctx.fill(); ctx.stroke();
            // bun bottom
            ctx.beginPath(); ctx.ellipse(0, 7, ft.r, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#D4A050'; ctx.fill(); ctx.stroke();
        }

        // glow for biscuit
        if (type === 'biscuit') {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, ft.r + 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    },

    /* ── KENNEL / OBSTACLE ── */
    kennel(ctx, x, y, w = 80, h = 60) {
        // roof
        ctx.fillStyle = '#CC3300';
        ctx.beginPath();
        ctx.moveTo(x - 5, y); ctx.lineTo(x + w / 2, y - 25); ctx.lineTo(x + w + 5, y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#881100'; ctx.lineWidth = 2; ctx.stroke();
        // body
        ctx.fillStyle = '#D4A050';
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        U.roundRect(ctx, x, y, w, h, 6);
        ctx.fill(); ctx.stroke();
        // door hole
        ctx.fillStyle = '#2a1a08';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 15, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 2; ctx.stroke();
        // name tag
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('WOOF', x + w / 2, y + 12);
    },

    /* ── FENCE ── */
    fence(ctx, x, y, w, h = 50) {
        const postW = 8, postGap = 28;
        ctx.fillStyle = '#D4AA7A';
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        // rails
        ctx.fillRect(x, y + 12, w, 6);
        ctx.fillRect(x, y + 32, w, 6);
        // posts
        for (let px = x; px < x + w; px += postGap) {
            U.roundRect(ctx, px, y, postW, h, 2);
            ctx.fill(); ctx.stroke();
        }
    },

    /* ── GATE ── */
    gate(ctx, x, y, w = 60, h = 70, open = false) {
        const angle = open ? -Math.PI / 2.2 : 0;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = '#888';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2.5;
        U.roundRect(ctx, 0, 0, w, h, 4);
        ctx.fill(); ctx.stroke();
        // bars
        for (let bx = 8; bx < w - 4; bx += 10) {
            ctx.fillRect(bx, 2, 4, h - 4);
        }
        // cross brace
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.strokeStyle = '#666'; ctx.stroke();
        ctx.restore();
        // post
        ctx.fillStyle = '#666';
        ctx.fillRect(x - 8, y - 5, 10, h + 12);
        ctx.strokeStyle = '#444'; ctx.stroke();
    },

    /* ── PLATFORM / GROUND TILE ── */
    groundTile(ctx, x, y, w, h, color, accentColor) {
        ctx.fillStyle = color;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        U.roundRect(ctx, x, y, w, h, 4);
        ctx.fill();
        ctx.stroke();
        // top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);
    },

    /* ── CHECKPOINT FLAG ── */
    checkpoint(ctx, x, y, activated = false) {
        const color = activated ? '#00FF88' : '#FFFF00';
        // pole
        ctx.fillStyle = '#888';
        ctx.fillRect(x - 3, y - 70, 6, 70);
        // flag wave
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 70);
        ctx.quadraticCurveTo(x + 30, y - 58, x + 3, y - 46);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
        if (activated) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 9px Impact';
            ctx.textAlign = 'left';
            ctx.fillText('CP', x + 7, y - 59);
        }
    },

    /* ── GOLDEN PEANUT BUTTER BISCUIT ── */
    goldenBiscuit(ctx, cx, cy, frame) {
        const t = frame * 0.06;
        const bob = Math.sin(t * 3) * 5;
        const rot = Math.sin(t * 1.5) * 0.15;

        ctx.save();
        ctx.translate(cx, cy + bob);
        ctx.rotate(rot);

        // outer glow
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
        glow.addColorStop(0, 'rgba(255,215,0,0.5)');
        glow.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();

        // bone shape gold
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        [-22, 22].forEach(bx => {
            [-4, 4].forEach(by => {
                ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            });
        });

        // sparkles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + t;
            const sx = Math.cos(angle) * 30;
            const sy = Math.sin(angle) * 30;
            U.drawStar(ctx, sx, sy, 4, 5, 2, '#FFD700');
        }

        ctx.restore();
    },

    /* ── LEVEL COMPLETE BANNER ── */
    levelComplete(ctx, levelNum, frame) {
        const t = frame * 0.05;
        const scale = U.clamp(frame / 20, 0, 1);
        ctx.save();
        ctx.translate(CFG.W / 2, CFG.H / 2);
        ctx.scale(scale, scale);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        U.roundRect(ctx, -260, -100, 520, 200, 20);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4 + Math.sin(t * 5) * 2;
        ctx.stroke();

        U.drawText(ctx, `LEVEL ${levelNum} COMPLETE!`, 0, -40, {
            size: 42, color: '#FFD700', outline: '#000', outlineW: 6, shadow: true
        });
        U.drawText(ctx, 'Choose your upgrade...', 0, 30, {
            size: 22, color: '#FFF', outline: '#333', outlineW: 3
        });
        ctx.restore();
    }
};
