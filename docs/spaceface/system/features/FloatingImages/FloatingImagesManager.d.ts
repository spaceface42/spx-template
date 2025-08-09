// FloatingImagesManager.d.ts
export declare class FloatingImagesManager {
    constructor(container: HTMLElement);

    /**
     * Resets all image positions in the floating animation.
     */
    resetAllImagePositions(): void;

    /**
     * Stops the floating images and frees resources.
     */
    destroy(): void;

    /**
     * Optionally pause the floating animation.
     */
    pause?(): void;

    /**
     * Optionally resume the floating animation.
     */
    resume?(): void;
}
