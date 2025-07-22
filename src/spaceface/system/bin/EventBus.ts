type Listener<T = any> = {
    fn: (payload: T) => any;
    priority: number;
};

type AnyListener = {
    fn: (event: string, payload: any) => any;
    priority: number;
};

export class EventBus {
    private listeners: Record<string, Listener[]> = {};
    private anyListeners: AnyListener[] = [];

    // Add event listener with optional priority
    on<T = any>(
        event: string,
        fn: (payload: T) => any,
        priority = 0
    ): () => void {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push({ fn, priority });
        this._sortListeners(event);
        // Return unsubscribe function
        return () => this.off(event, fn);
    }

    // Add one-time listener
    once<T = any>(event: string, fn: (payload: T) => any, priority = 0): void {
        const wrapper = (payload: T) => {
            fn(payload);
            this.off(event, wrapper);
        };
        this.on(event, wrapper, priority);
    }

    // Add listener for all events
    onAny(fn: (event: string, payload: any) => any, priority = 0): () => void {
        this.anyListeners.push({ fn, priority });
        this._sortAnyListeners();
        // Return unsubscribe function
        return () => this.offAny(fn);
    }

    // Remove event listener
    off(event: string, fn: (payload: any) => any): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(
            (obj) => obj.fn !== fn
        );
    }

    // Remove onAny listener
    offAny(fn: (event: string, payload: any) => any): void {
        this.anyListeners = this.anyListeners.filter((obj) => obj.fn !== fn);
    }

    // Emit synchronously
    emit<T = any>(event: string, payload?: T): void {
        if (!event) {
            this._handleError(
                "EventBus: Event name is undefined or empty",
                new Error("Invalid event name")
            );
            return;
        }

        for (const { fn } of this.listeners[event] || []) {
            try {
                fn(payload);
            } catch (err) {
                this._handleError(`Error in listener for "${event}":`, err);
            }
        }

        for (const { fn } of this.anyListeners) {
            try {
                fn(event, payload);
            } catch (err) {
                this._handleError(`Error in onAny listener:`, err);
            }
        }
    }

    // Emit and await async listeners
    async emitAsync<T = any>(event: string, payload?: T): Promise<any[]> {
        if (!event) {
            this._handleError(
                "EventBus: Event name is undefined or empty",
                new Error("Invalid event name")
            );
            return [];
        }

        const results: any[] = [];

        for (const { fn } of this.listeners[event] || []) {
            try {
                results.push(await fn(payload));
            } catch (err) {
                this._handleError(
                    `Async error in listener for "${event}":`,
                    err
                );
            }
        }

        for (const { fn } of this.anyListeners) {
            try {
                results.push(await fn(event, payload));
            } catch (err) {
                this._handleError(`Async error in onAny listener:`, err);
            }
        }

        return results;
    }

    // Remove all listeners
    removeAllListeners(event?: string): void {
        if (!event) {
            this.listeners = {};
            this.anyListeners = [];
        } else if (event === "any") {
            this.anyListeners = [];
        } else {
            delete this.listeners[event];
        }
    }

    hasListeners(event: string): boolean {
        if (event === "any") return this.anyListeners.length > 0;
        return (this.listeners[event] || []).length > 0;
    }

    listenerCount(event: string): number {
        if (event === "any") return this.anyListeners.length;
        return (this.listeners[event] || []).length;
    }

    eventNames(): string[] {
        return Object.keys(this.listeners).filter(
            (e) => this.listeners[e].length > 0
        );
    }

    getListeners(event: string): Function[] {
        if (event === "any") return this.anyListeners.map((obj) => obj.fn);
        return (this.listeners[event] || []).map((obj) => obj.fn);
    }

    private _sortListeners(event: string): void {
        this.listeners[event].sort((a, b) => b.priority - a.priority);
    }

    private _sortAnyListeners(): void {
        this.anyListeners.sort((a, b) => b.priority - a.priority);
    }

    private _handleError(message: string, error: any): void {
        console.error(message, error);
        try {
            if (message !== "eventbus:error") {
                this.emit("eventbus:error", { message, error });
            }
        } catch (e) {
            console.error('EventBus failed to emit "eventbus:error":', e);
        }
    }
}

export const eventBus = new EventBus();

/**

// Standard usage
eventBus.on('ready', data => console.log('READY', data));

// With priority (higher = earlier)
eventBus.on('ready', () => console.log('priority 10'), 10);
eventBus.on('ready', () => console.log('priority 1'), 1);

// onAny
eventBus.onAny((event, data) => console.log('Any:', event, data), 5);

// Async
eventBus.on('load', async (data) => {
  await new Promise(r => setTimeout(r, 100));
  console.log('Async load done:', data);
});

// Emit
eventBus.emit('ready', { time: Date.now() });

// Emit async
await eventBus.emitAsync('load', { thing: 'foo' });



*/
