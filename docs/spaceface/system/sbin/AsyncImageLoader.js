export class AsyncImageLoader {
    container;
    includePicture;
    _imageCache;
    _destroyed = false;
    constructor(container, options = {}) {
        if (!container || !(container instanceof Element)) {
            throw new Error('AsyncImageLoader: container must be a valid DOM Element.');
        }
        const defaultOptions = { includePicture: false };
        const mergedOptions = { ...defaultOptions, ...options };
        this.includePicture = !!mergedOptions.includePicture;
        this.container = container;
        this._imageCache = new WeakMap();
    }
    checkDestroyed() {
        if (this._destroyed || !this.container) {
            throw new Error('AsyncImageLoader: Instance has been destroyed.');
        }
    }
    getImages(selector = 'img') {
        this.checkDestroyed();
        if (typeof selector !== 'string' || !selector.trim())
            return [];
        let images = Array.from(this.container.querySelectorAll(selector))
            .filter((el) => el instanceof HTMLImageElement);
        if (this.includePicture) {
            const pictureImgs = Array.from(this.container.querySelectorAll('picture img'))
                .filter((el) => el instanceof HTMLImageElement);
            images = images.concat(pictureImgs);
        }
        return Array.from(new Set(images));
    }
    async waitForImagesToLoad(selector = 'img') {
        const images = this.getImages(selector);
        const loadPromises = images.map(img => {
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
        if (images.length === 0)
            return [];
        return images.map(img => {
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
                href: img.closest('a')?.href ?? null,
                sources
            };
        });
    }
    destroy() {
        this.container = null;
        this._destroyed = true;
    }
}
