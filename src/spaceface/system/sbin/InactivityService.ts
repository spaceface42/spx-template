import { InactivityWatcher } from "./InactivityWatcher.js";

let instance: InactivityService | null = null;

export class InactivityService extends InactivityWatcher {
    constructor(options: Record<string, any> = {}) {
        if (instance) return instance;
        super(options);
        instance = this;
    }
}
