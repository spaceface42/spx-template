export class EventBus {
    listeners = {};
    anyListeners = [];
    on(event, fn, priority = 0) {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event].push({ fn, priority });
        this._sortListeners(event);
        return () => this.off(event, fn);
    }
    once(event, fn, priority = 0) {
        const wrapper = (payload) => {
            fn(payload);
            this.off(event, wrapper);
        };
        this.on(event, wrapper, priority);
    }
    onAny(fn, priority = 0) {
        this.anyListeners.push({ fn, priority });
        this._sortAnyListeners();
        return () => this.offAny(fn);
    }
    off(event, fn) {
        if (!this.listeners[event])
            return;
        this.listeners[event] = this.listeners[event].filter((obj) => obj.fn !== fn);
    }
    offAny(fn) {
        this.anyListeners = this.anyListeners.filter((obj) => obj.fn !== fn);
    }
    emit(event, payload) {
        if (!event) {
            this._handleError("EventBus: Event name is undefined or empty", new Error("Invalid event name"));
            return;
        }
        for (const { fn } of this.listeners[event] || []) {
            try {
                fn(payload);
            }
            catch (err) {
                this._handleError(`Error in listener for "${event}":`, err);
            }
        }
        for (const { fn } of this.anyListeners) {
            try {
                fn(event, payload);
            }
            catch (err) {
                this._handleError(`Error in onAny listener:`, err);
            }
        }
    }
    async emitAsync(event, payload) {
        if (!event) {
            this._handleError("EventBus: Event name is undefined or empty", new Error("Invalid event name"));
            return [];
        }
        const results = [];
        for (const { fn } of this.listeners[event] || []) {
            try {
                results.push(await fn(payload));
            }
            catch (err) {
                this._handleError(`Async error in listener for "${event}":`, err);
            }
        }
        for (const { fn } of this.anyListeners) {
            try {
                results.push(await fn(event, payload));
            }
            catch (err) {
                this._handleError(`Async error in onAny listener:`, err);
            }
        }
        return results;
    }
    removeAllListeners(event) {
        if (!event) {
            this.listeners = {};
            this.anyListeners = [];
        }
        else if (event === "any") {
            this.anyListeners = [];
        }
        else {
            delete this.listeners[event];
        }
    }
    hasListeners(event) {
        if (event === "any")
            return this.anyListeners.length > 0;
        return (this.listeners[event] || []).length > 0;
    }
    listenerCount(event) {
        if (event === "any")
            return this.anyListeners.length;
        return (this.listeners[event] || []).length;
    }
    eventNames() {
        return Object.keys(this.listeners).filter((e) => this.listeners[e].length > 0);
    }
    getListeners(event) {
        if (event === "any")
            return this.anyListeners.map((obj) => obj.fn);
        return (this.listeners[event] || []).map((obj) => obj.fn);
    }
    _sortListeners(event) {
        this.listeners[event].sort((a, b) => b.priority - a.priority);
    }
    _sortAnyListeners() {
        this.anyListeners.sort((a, b) => b.priority - a.priority);
    }
    _handleError(message, error) {
        console.error(message, error);
        try {
            if (message !== "eventbus:error") {
                this.emit("eventbus:error", { message, error });
            }
        }
        catch (e) {
            console.error('EventBus failed to emit "eventbus:error":', e);
        }
    }
}
export const eventBus = new EventBus();
