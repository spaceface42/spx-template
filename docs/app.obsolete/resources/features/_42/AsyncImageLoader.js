/**
 * Utility class for parsing and handling <img> elements inside a DOM container.
 * Supports synchronous querying, asynchronous image loading, and extraction of image metadata.
 */
export class AsyncImageLoader {
    /**
     * @param {Element} container - The DOM element within which to search for images.
     * @throws {Error} If the container is not a valid DOM Element.
     */
    constructor(container) {
        if (!container || !(container instanceof Element)) {
            throw new Error('ImageLoader: container must be a valid DOM Element.');
        }
        this.container = container;
    }

    /**
     * Returns an array of elements matching the selector inside the container.
     * @param {string} [selector='img'] - CSS selector to match images.
     * @returns {Element[]} Array of matching elements.
     */
    getImages(selector = 'img') {
        const images = Array.from(this.container.querySelectorAll(selector));
        // console.log('getImages', images);
        return images;
    }

    /**
     * Waits for all images matching the selector to finish loading (or erroring).
     * Resolves immediately for images that are already loaded.
     * @param {string} [selector='img'] - CSS selector to match images.
     * @returns {Promise<Element[]>} Resolves with the array of matching image elements when all are loaded.
     */
    async waitForImagesToLoad(selector = 'img') {
        const images = this.getImages(selector);
        await Promise.all(images.map(img => {
            if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        }));
        return images;
    }

    /**
     * Returns an array of metadata objects for each image matching the selector.
     * @param {string} [selector='img'] - CSS selector to match images.
     * @returns {Array<{element: Element, src: string, alt: string, href: string|null}>}
     *   Each object contains:
     *     - element: The image DOM element.
     *     - src: The image source URL.
     *     - alt: The image alt text.
     *     - href: The closest parent <a>'s href attribute, or null if not wrapped in a link.
     */
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
}
