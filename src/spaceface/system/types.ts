// types.ts
export type WaitForElementOptions = {
  timeout?: number;
  root?: ParentNode;
  signal?: AbortSignal;
};

export type WaitForElementResult<T extends Element = Element> = Promise<T | T[]>;

export interface PartialLoaderOptions {
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    cacheEnabled?: boolean;
    debug?: boolean;
}

export interface PartialInfo {
    id: string;
    url: string;
    container: HTMLElement;
}

export interface PartialLoadResult {
    success: boolean;
    url: string;
    cached: boolean;
}

export interface PartialFetchOptions {
    replace?: boolean; // default true
    signal?: AbortSignal;
}

export interface PartialFetchEventPayload {
    url: string;
    targetSelector: string;
    html?: string;
    error?: unknown;
}


//

// types.ts

/** EventBus listener for a specific event type */
export type Listener<T = any> = {
    fn: (payload: T) => any;
    priority: number;
};

/** EventBus listener for any event */
export type AnyListener = {
    fn: (event: string, payload: any) => any;
    priority: number;
};

/** Function signature for unsubscribing a listener */
export type UnsubscribeFn = () => void;

/** Payload type for EventBus debug/error events */
export type EventBusErrorPayload = {
    message: string;
    error: any;
};

/** Public EventBus interface (for consumers) */
export interface IEventBus {
    on<T = any>(event: string, fn: (payload: T) => any, priority?: number): UnsubscribeFn;
    once<T = any>(event: string, fn: (payload: T) => any, priority?: number): void;
    onAny(fn: (event: string, payload: any) => any, priority?: number): UnsubscribeFn;
    off(event: string, fn: (payload: any) => any): void;
    offAny(fn: (event: string, payload: any) => any): void;
    emit<T = any>(event: string, payload?: T): void;
    emitAsync<T = any>(event: string, payload?: T): Promise<any[]>;
    removeAllListeners(event?: string): void;
    hasListeners(event: string): boolean;
    listenerCount(event: string): number;
    eventNames(): string[];
    getListeners(event: string): Function[];
}

/** Binding for EventBus events inside EventBinder */
export type BusBinding = {
    event: string;
    handler: (...args: any[]) => void;
};

/** Binding for DOM events inside EventBinder */
export type DomBinding = {
    target: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options: AddEventListenerOptions | boolean;
    controller: AbortController;
};

/** Stats returned from EventBinder.getStats */
export type EventBinderStats = {
    busEvents: number;
    domEvents: number;
    totalEvents: number;
};

/** Public EventBinder interface */
export interface IEventBinder {
    bindBus(event: string, handler: (...args: any[]) => void): void;
    bindDOM(
        target: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions | boolean
    ): void;
    unbindAll(): void;
    getStats(): EventBinderStats;
    hasBindings(): boolean;
}

