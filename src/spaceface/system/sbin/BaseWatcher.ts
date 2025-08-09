export abstract class BaseWatcher {
    protected target: EventTarget;
    protected debug: boolean;
    protected listening = false;
    protected destroyed = false;

    constructor(target: EventTarget, debug: boolean = false) {
        if (!target || !(target instanceof EventTarget)) {
            throw new Error(`${this.constructor.name}: target must be a valid EventTarget.`);
        }
        this.target = target;
        this.debug = debug;
    }

    protected log(message: string) {
        if (this.debug) console.log(`[${this.constructor.name}] ${message}`);
    }

    protected checkDestroyed() {
        if (this.destroyed) {
            throw new Error(`${this.constructor.name} has been destroyed.`);
        }
    }

    public destroy() {
        this.log("Destroying watcher");
        this.removeEventListeners();
        this.destroyed = true;
    }

    protected abstract addEventListeners(): void;
    protected abstract removeEventListeners(): void;
}
