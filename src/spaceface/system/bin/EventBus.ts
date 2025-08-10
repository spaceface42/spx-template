import {
    Listener,
    AnyListener,
    UnsubscribeFn,
    EventBusErrorPayload,
    IEventBus
} from "./types.js";

export class EventBus implements IEventBus {
    private listeners: Record<string, Listener[]> = {};
    private anyListeners: AnyListener[] = [];

    on<T = any>(
        event: string,
        fn: (payload: T) => any,
        priority = 0
    ): UnsubscribeFn {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push({ fn, priority });
        this._sortListeners(event);
        return () => this.off(event, fn);
    }

    once<T = any>(
        event: string,
        fn: (payload: T) => any,
        priority = 0
    ): void {
        const wrapper = (payload: T) => {
            fn(payload);
            this.off(event, wrapper);
        };
        this.on(event, wrapper, priority);
    }

    onAny(
        fn: (event: string, payload: any) => any,
        priority = 0
    ): UnsubscribeFn {
        this.anyListeners.push({ fn, priority });
        this._sortAnyListeners();
        return () => this.offAny(fn);
    }

    off(event: string, fn: (payload: any) => any): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(
            (obj) => obj.fn !== fn
        );
    }

    offAny(fn: (event: string, payload: any) => any): void {
        this.anyListeners = this.anyListeners.filter((obj) => obj.fn !== fn);
    }

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
                this.emit<EventBusErrorPayload>("eventbus:error", { message, error });
            }
        } catch (e) {
            console.error('EventBus failed to emit "eventbus:error":', e);
        }
    }
}

export const eventBus = new EventBus();
