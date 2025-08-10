// features types

// PerformanceMonitor
export interface PerformanceSettings {
    maxImages: number;
    speedMultiplier: number;
    useSubpixel: boolean;
}

// FloatingImagesManager
export interface FloatingImagesManagerOptions {
    maxImages?: number;
}

// FloatingImage
export interface ContainerDimensions {
    width: number;
    height: number;
}

export interface FloatingImageOptions {
    useSubpixel?: boolean;
}