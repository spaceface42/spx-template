import { InactivityWatcher } from "./InactivityWatcher.js";
export class InactivityService extends InactivityWatcher {
    static instance = null;
    constructor(options = {}) {
        super(options);
    }
    static getInstance(options = {}) {
        if (!this.instance) {
            this.instance = new InactivityService(options);
        }
        return this.instance;
    }
}
// const inactivity = InactivityWatcher.getInstance({ inactivityDelay: 5000 });
