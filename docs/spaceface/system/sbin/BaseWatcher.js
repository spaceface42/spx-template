export class BaseWatcher {
    target;
    debug;
    listening = false;
    destroyed = false;
    constructor(target, debug = false) {
        if (!target || !(target instanceof EventTarget)) {
            throw new Error(`${this.constructor.name}: target must be a valid EventTarget.`);
        }
        this.target = target;
        this.debug = debug;
    }
    log(message) {
        if (this.debug)
            console.log(`[${this.constructor.name}] ${message}`);
    }
    checkDestroyed() {
        if (this.destroyed) {
            throw new Error(`${this.constructor.name} has been destroyed.`);
        }
    }
    destroy() {
        this.log("Destroying watcher");
        this.removeEventListeners();
        this.destroyed = true;
    }
}
