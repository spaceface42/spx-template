/**
 * AsyncImageLoader
 *
 * Utility class for parsing and handling <img> elements inside a DOM container.
 * Supports synchronous querying, asynchronous image loading, and extraction of image metadata.
 * Optionally supports <picture> and <source> elements for responsive images.
 *
 * @example
 * // Basic usage:
 * const loader = new AsyncImageLoader(document.getElementById('gallery'));
 * await loader.waitForImagesToLoad();
 * const data = loader.getImageData();
 *
 * // With <picture> support:
 * const loader = new AsyncImageLoader(document.getElementById('gallery'), { includePicture: true });
 * await loader.waitForImagesToLoad();
 * const data = loader.getImageData();
 */
export class AsyncImageLoader {
    /**
     * @param {Element} container - The DOM container to search for images.
     * @param {Object} [options]
     * @param {boolean} [options.includePicture=false] - Whether to include <picture> and <source> images.
     */
    constructor(container, options = {}) {
        if (!container || !(container instanceof Element)) {
            throw new Error('ImageLoader: container must be a valid DOM Element.');
        }
        this.container = container;
        this._imageCache = new WeakMap(); // Use WeakMap for automatic cleanup
        this.includePicture = options.includePicture || false;
    }

    /**
     * Get all images (optionally including <picture> and <source>).
     * @param {string} [selector='img'] - CSS selector for images.
     * @returns {HTMLImageElement[]}
     */
    getImages(selector = 'img') {
        let images = Array.from(this.container.querySelectorAll(selector));
        if (this.includePicture) {
            // Find <picture> elements and their <img> children
            const pictureImgs = Array.from(this.container.querySelectorAll('picture img'));
            images = images.concat(pictureImgs);

            // Optionally, include <source> elements (get their parent <picture> or <img>)
            // Note: <source> elements themselves are not images, but we can extract their srcset for metadata
            // We'll handle <source> in getImageData
        }
        // Remove duplicates
        images = Array.from(new Set(images));
        return images;
    }

    /**
     * Wait for all images to load (optionally including <picture> and <source>).
     * Resolves when all images are loaded or errored.
     * @param {string} [selector='img']
     * @returns {Promise<HTMLImageElement[]>}
     */
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

    /**
     * Get metadata for all images (optionally including <picture> and <source>).
     * Each object contains the image element, src, alt, href, and (if enabled) sources from <source> tags.
     * @param {string} [selector='img']
     * @returns {Array<Object>} Array of image metadata objects.
     */
    getImageData(selector = 'img') {
        const images = this.getImages(selector);
        if (images.length === 0) {
            return [];
        }
        return images.map(img => {
            // If inside a <picture>, collect <source> srcset as well
            let sources = [];
            if (this.includePicture) {
                const picture = img.closest('picture');
                if (picture) {
                    sources = Array.from(picture.querySelectorAll('source')).map(source => ({
                        srcset: source.srcset || '',
                        type: source.type || '',
                        media: source.media || ''
                    }));
                }
            }
            return {
                element: img,
                src: img.src || '',
                alt: img.alt || '',
                href: img.closest('a') ? img.closest('a').href : null,
                sources
            };
        });
    }

    /**
     * Clean up references.
     */
    destroy() {
        // WeakMap will automatically clean up when elements are garbage collected
        this.container = null;
    }
}
