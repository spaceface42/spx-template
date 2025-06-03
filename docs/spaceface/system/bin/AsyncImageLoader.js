/**
 * Utility class for parsing and handling <img> elements inside a DOM container.
 * Supports synchronous querying, asynchronous image loading, and extraction of image metadata.
 */
export class AsyncImageLoader {
    constructor(container) {
        if (!container || !(container instanceof Element)) {
            throw new Error('ImageLoader: container must be a valid DOM Element.');
        }
        this.container = container;
        this._imageCache = new WeakMap(); // Use WeakMap for automatic cleanup
    }

    getImages(selector = 'img') {
        const images = Array.from(this.container.querySelectorAll(selector));
        return images;
    }

    async waitForImagesToLoad(selector = 'img') {
        const images = this.getImages(selector);
        const loadPromises = images.map(img => {
            // Check cache first
            if (this._imageCache.has(img)) {
                return Promise.resolve();
            }
            
            if (img.complete && img.naturalWidth !== 0) {
                this._imageCache.set(img, true);
                return Promise.resolve();
            }
            
            return new Promise(resolve => {
                const cleanup = () => {
                    img.onload = null;
                    img.onerror = null;
                    this._imageCache.set(img, true);
                    resolve();
                };
                img.onload = cleanup;
                img.onerror = cleanup;
            });
        });
        
        await Promise.all(loadPromises);
        return images;
    }

    getImageData(selector = 'img') {
        const images = this.getImages(selector);
        if (images.length === 0) {
            return [];
        }
        return images.map(img => ({
            element: img,
            src: img.src || '',
            alt: img.alt || '',
            href: img.closest('a') ? img.closest('a').href : null
        }));
    }

    destroy() {
        // WeakMap will automatically clean up when elements are garbage collected
        this.container = null;
    }
}