import { eventBus } from "./EventBus.js";

type BusBinding = {
    event: string;
    handler: (...args: any[]) => void;
};

type DomBinding = {
    target: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options: AddEventListenerOptions | boolean;
    controller: AbortController;
};

export class EventBinder {
    private _busBindings: BusBinding[] = [];
    private _domBindings: DomBinding[] = [];
    private _debug: boolean;

    constructor(debug = false) {
        this._debug = debug;
    }

    private _emitDebug(method: string, details: any) {
        if (this._debug) {
            eventBus.emit("debug:EventBinder", { method, details });
        }
    }

    bindBus(event: string, handler: (...args: any[]) => void): void {
        eventBus.on(event, handler);
        this._busBindings.push({ event, handler });
        this._emitDebug("bindBus", { event, handler });
    }

    bindDOM(
        target: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions | boolean = false
    ): void {
        if (!(target && "addEventListener" in target)) {
            console.warn("EventBinder: Invalid DOM target", target);
            return;
        }

        const controller = new AbortController();
        const normalizedOptions =
            typeof options === "boolean"
                ? { capture: options, signal: controller.signal }
                : { ...options, signal: controller.signal };

        try {
            target.addEventListener(event, handler, normalizedOptions);
            this._domBindings.push({
                target,
                event,
                handler,
                options: normalizedOptions,
                controller,
            });
            this._emitDebug("bindDOM", { event, handler, target });
        } catch (err) {
            console.error("EventBinder: Failed to bind DOM event", err);
        }
    }

    unbindAll(): void {
        this._emitDebug("unbindAll", {
            busBindings: this._busBindings.length,
            domBindings: this._domBindings.length,
        });

        // Unbind EventBus events
        for (const { event, handler } of this._busBindings) {
            try {
                eventBus.off(event, handler);
                this._emitDebug("unbindBus", { event, handler });
            } catch (error) {
                console.error(
                    `EventBinder: Failed to unbind bus event "${event}"`,
                    error
                );
            }
        }

        // Abort and remove DOM events
        for (const { target, event, handler, options, controller } of this
            ._domBindings) {
            try {
                controller.abort();
                target.removeEventListener(event, handler, options);
                this._emitDebug("unbindDOM", { event, target });
            } catch (error) {
                console.error(
                    `EventBinder: Failed to unbind DOM event "${event}"`,
                    error
                );
            }
        }

        // Reset state
        this._busBindings.length = 0;
        this._domBindings.length = 0;
    }

    getStats(): { busEvents: number; domEvents: number; totalEvents: number } {
        const stats = {
            busEvents: this._busBindings.length,
            domEvents: this._domBindings.length,
            totalEvents: this._busBindings.length + this._domBindings.length,
        };
        this._emitDebug("getStats", stats);
        return stats;
    }

    hasBindings(): boolean {
        const has =
            this._busBindings.length > 0 || this._domBindings.length > 0;
        this._emitDebug("hasBindings", { has });
        return has;
    }
}
