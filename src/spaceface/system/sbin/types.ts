// filepath: c:\Users\ezsol\OneDrive\Documents\GitHub\spx-template\src\spaceface\system\sbin\types.ts



//

// ResizeManager-related types

export type ResizeCallback = () => void;

export type ElementResizeCallback = (entry: ResizeObserverEntry) => void;

export type ElementDimensions = {
    clientWidth: number;
    clientHeight: number;
    offsetWidth: number;
    offsetHeight: number;
};




//
// AsyncImageLoader-related types

export interface AsyncImageLoaderOptions {
    includePicture?: boolean;
}

export interface ImageSourceData {
    srcset: string;
    type: string;
    media: string;
}

export interface ImageMetadata {
    element: HTMLImageElement;
    src: string;
    alt: string;
    href: string | null;
    sources: ImageSourceData[];
}

//
export type InactivityWatcherOptions = {
    inactivityDelay?: number;
    target?: EventTarget;
    debug?: boolean;
};

export type WatcherState = {
    listening: boolean;
    destroyed: boolean;
};










