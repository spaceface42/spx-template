import {
    BusBinding,
    DomBinding,
    EventBinderStats,
    IEventBinder
} from "../types/bin.js";
import { eventBus } from "./EventBus.js";

export interface PartialFetchOptions {
    replace?: boolean;
    signal?: AbortSignal;

    /** Optional: Temporary event bindings for the duration of one load */
    withBindings?: (binder: EventBinder) => void;

    /** Enable binder debug mode (emits debug:EventBinder events) */
    debugBindings?: boolean;
}


export class EventBinder implements IEventBinder {
    private busBindings: BusBinding[] = [];
    private domBindings: DomBinding[] = [];
    private debugMode: boolean;

    constructor(debug = false) {
        this.debugMode = debug;
    }

    private debug(method: string, details: any): void {
        if (this.debugMode) {
            eventBus.emit("debug:EventBinder", { method, details });
        }
    }

    bindBus(event: string, handler: (...args: any[]) => void): void {
        eventBus.on(event, handler);
        this.busBindings.push({ event, handler });
        this.debug("bindBus", { event, handler });
    }

    bindDOM(
        target: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions | boolean = false
    ): void {
        if (!(target instanceof EventTarget)) {
            console.warn("EventBinder: Invalid DOM target", target);
            return;
        }

        const controller = new AbortController();
        const normalizedOptions: AddEventListenerOptions =
            typeof options === "boolean"
                ? { capture: options, signal: controller.signal }
                : { ...options, signal: controller.signal };

        try {
            target.addEventListener(event, handler, normalizedOptions);
            this.domBindings.push({
                target,
                event,
                handler,
                options: normalizedOptions,
                controller,
            });
            this.debug("bindDOM", { event, handler, target });
        } catch (err) {
            console.error(`EventBinder: Failed to bind DOM event "${event}"`, err);
        }
    }

    unbindAll(): void {
        this.debug("unbindAll", {
            busBindings: this.busBindings.length,
            domBindings: this.domBindings.length,
        });

        // Unbind EventBus bindings
        for (const { event, handler } of this.busBindings) {
            try {
                eventBus.off(event, handler);
                this.debug("unbindBus", { event, handler });
            } catch (error) {
                console.error(`EventBinder: Failed to unbind bus event "${event}"`, error);
            }
        }

        // Unbind DOM bindings
        for (const { target, event, handler, options, controller } of this.domBindings) {
            try {
                controller.abort();
                target.removeEventListener(event, handler, options);
                this.debug("unbindDOM", { event, target });
            } catch (error) {
                console.error(`EventBinder: Failed to unbind DOM event "${event}"`, error);
            }
        }

        this.busBindings = [];
        this.domBindings = [];
    }

    getStats(): EventBinderStats {
        const stats: EventBinderStats = {
            busEvents: this.busBindings.length,
            domEvents: this.domBindings.length,
            totalEvents: this.busBindings.length + this.domBindings.length,
        };
        this.debug("getStats", stats);
        return stats;
    }

    hasBindings(): boolean {
        const has = this.busBindings.length > 0 || this.domBindings.length > 0;
        this.debug("hasBindings", { has });
        return has;
    }

    /** Factory method: creates an EventBinder and auto-unbinds when callback ends */
    static withAutoUnbind<T>(
        callback: (binder: EventBinder) => T | Promise<T>,
        debug = false
    ): Promise<T> | T {
        const binder = new EventBinder(debug);
        const result = callback(binder);

        // If callback returns a Promise, clean up after it resolves/rejects
        if (result instanceof Promise) {
            return result.finally(() => binder.unbindAll());
        } else {
            binder.unbindAll();
            return result;
        }
    }
}

// Optionally export a default instance
export const eventBinder = new EventBinder();
