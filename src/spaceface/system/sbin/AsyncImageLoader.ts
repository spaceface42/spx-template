interface AsyncImageLoaderOptions {
    includePicture?: boolean;
}

interface ImageSourceData {
    srcset: string;
    type: string;
    media: string;
}

interface ImageMetadata {
    element: HTMLImageElement;
    src: string;
    alt: string;
    href: string | null;
    sources: ImageSourceData[];
}

export class AsyncImageLoader {
    private container: Element | null;
    private includePicture: boolean;
    private _imageCache: WeakMap<HTMLImageElement, boolean>;
    private _destroyed = false;

    constructor(container: Element, options: AsyncImageLoaderOptions = {}) {
        if (!container || !(container instanceof Element)) {
            throw new Error('AsyncImageLoader: container must be a valid DOM Element.');
        }

        const defaultOptions: AsyncImageLoaderOptions = { includePicture: false };
        const mergedOptions = { ...defaultOptions, ...options };

        this.includePicture = !!mergedOptions.includePicture;
        this.container = container;
        this._imageCache = new WeakMap();
    }

    private checkDestroyed(): void {
        if (this._destroyed || !this.container) {
            throw new Error('AsyncImageLoader: Instance has been destroyed.');
        }
    }

    public getImages(selector: string = 'img'): HTMLImageElement[] {
        this.checkDestroyed();
        if (typeof selector !== 'string' || !selector.trim()) return [];

        let images = Array.from(this.container!.querySelectorAll(selector))
            .filter((el): el is HTMLImageElement => el instanceof HTMLImageElement);

        if (this.includePicture) {
            const pictureImgs = Array.from(this.container!.querySelectorAll('picture img'))
                .filter((el): el is HTMLImageElement => el instanceof HTMLImageElement);
            images = images.concat(pictureImgs);
        }

        return Array.from(new Set(images));
    }

    public async waitForImagesToLoad(selector: string = 'img'): Promise<HTMLImageElement[]> {
        const images = this.getImages(selector);

        const loadPromises = images.map(img => {
            if (this._imageCache.has(img)) {
                return Promise.resolve();
            }

            if (img.complete && img.naturalWidth !== 0) {
                this._imageCache.set(img, true);
                return Promise.resolve();
            }

            return new Promise<void>(resolve => {
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

    public getImageData(selector: string = 'img'): ImageMetadata[] {
        const images = this.getImages(selector);
        if (images.length === 0) return [];

        return images.map(img => {
            let sources: ImageSourceData[] = [];

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

    public destroy(): void {
        this.container = null;
        this._destroyed = true;
    }
}
