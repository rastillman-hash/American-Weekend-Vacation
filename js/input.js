'use strict';

class Input {
    constructor() {
        this._down = {};
        this._pressed = {};
        this._released = {};
        window.addEventListener('keydown', e => {
            if (!this._down[e.key]) this._pressed[e.key] = true;
            this._down[e.key] = true;
            // prevent page scrolling on arrow keys / space
            if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            this._down[e.key] = false;
            this._released[e.key] = true;
        });
    }

    isDown(keys)     { return keys.some(k => !!this._down[k]); }
    wasPressed(keys) { return keys.some(k => !!this._pressed[k]); }
    wasReleased(keys){ return keys.some(k => !!this._released[k]); }

    /* call once per frame AFTER processing */
    flush() {
        this._pressed  = {};
        this._released = {};
    }
}
