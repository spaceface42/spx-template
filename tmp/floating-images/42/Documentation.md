# Documentation

This documentation covers the main utility classes used in the floating images project:

- [DomReady](#domready)
- [AsyncImageDomParser](#asyncimagedomparser)
- [FloatingImageManager](#floatingimagemanager)
- [FloatingImage](#floatingimage)

---

## DomReady

A utility class for waiting until the DOM is fully parsed and ready.  
Allows you to `await` DOM readiness in any async context.

### Usage

```js
import DomReady from './DomReady.js';

await DomReady.ready();
// Now it's safe to access the DOM
```

### Methods

#### `static ready()`

Returns a Promise that resolves when the DOM is ready.

**Returns:**  
- `Promise<void>`

---

## AsyncImageDomParser

A utility class for robustly parsing and handling `<img>` elements inside a given DOM container.  
Supports synchronous querying, asynchronous image loading, and extraction of image metadata.

### Constructor

```js
new AsyncImageDomParser(container)
```

- **container** (`Element`): The DOM element within which to search for images.  
  Throws an error if the container is not a valid DOM element.

### Methods

#### `getImages(selector = 'img')`

Returns an array of elements matching the selector (default: all `<img>` elements) inside the container.

**Parameters:**
- `selector` (`string`, optional): CSS selector to match images. Defaults to `'img'`.

**Returns:**  
- `Array<Element>`: Array of matching elements.

#### `async waitForImagesToLoad(selector = 'img')`

Waits for all images matching the selector to finish loading (or erroring).  
Resolves immediately for images that are already loaded.

**Parameters:**
- `selector` (`string`, optional): CSS selector to match images. Defaults to `'img'`.

**Returns:**  
- `Promise<Array<Element>>`: Resolves with the array of matching image elements when all are loaded.

#### `getImageData(selector = 'img')`

Returns an array of metadata objects for each image matching the selector.

**Parameters:**
- `selector` (`string`, optional): CSS selector to match images. Defaults to `'img'`.

**Returns:**  
- `Array<Object>`: Each object contains:
  - `element`: The image DOM element.
  - `src`: The image source URL.
  - `alt`: The image alt text.
  - `href`: The closest parent `<a>`'s `href` attribute, or `null` if not wrapped in a link.

### Example Usage

```js
import AsyncImageDomParser from './AsyncImageDomParser.js';

const container = document.getElementById('container');
const parser = new AsyncImageDomParser(container);

// Get all images
const images = parser.getImages();

// Wait for all images to load
await parser.waitForImagesToLoad();

// Get metadata for all images
const imageData = parser.getImageData();
```

### Notes

- If no images are found, `getImageData` returns an empty array.
- The class is robust against invalid containers and missing images.
- Use the selector parameter to target specific images if needed.

---

## FloatingImageManager

Manages floating images inside a container, animating their movement and handling resizing, speed controls,  
and pausing animation when the container is not in the viewport.

### Constructor

```js
new FloatingImageManager(containerOrId)
```

- **containerOrId** (`Element|string`): The container DOM element or its ID.  
  Throws an error if the container cannot be found.

### Methods

#### `addExistingImage(imgElement)`

Adds an existing image element to the floating images manager.

**Parameters:**
- `imgElement` (`Element`): The image DOM element to add.

#### `changeSpeed(factor)`

Changes the animation speed by multiplying the current speed by the given factor.  
Speed is clamped between 0.2 and 5.

**Parameters:**
- `factor` (`number`): The factor to multiply the speed by.

#### `handleResize()`

Ensures all images are within the new container bounds after a resize.  
Updates image sizes and clamps their positions.

#### `animate()`

The main animation loop.
- Skips animation if the container is not in the viewport.
- Skips position updates if speedMultiplier is 0.
- Batches position calculations and DOM writes for performance.
- Called automatically after initialization.

#### `updateContainerDimensions()`

Updates the stored container dimensions (width and height).  
Should be called whenever the container size may have changed.

---

## FloatingImage

Represents a single floating image, handling its position, velocity, and DOM updates.

### Constructor

```js
new FloatingImage(element, container)
```

- **element** (`Element`): The image DOM element.
- **container** (`Element`): The container DOM element.

### Methods

#### `update(speedMultiplier = 1, applyPosition = true)`

Updates the image's position based on its velocity and the speed multiplier.  
Optionally applies the new position to the DOM.

**Parameters:**
- `speedMultiplier` (`number`, optional): Multiplier for the image's velocity.
- `applyPosition` (`boolean`, optional): Whether to update the DOM position immediately.

#### `updatePosition()`

Applies the current position to the DOM element (e.g., via CSS transform or left/top).

---

# General Notes

- All classes are ES module compatible.
- All DOM operations are robust and safe for use in modern browsers.
- Promises are used where asynchronous operations (like DOM readiness or image loading) are required.
- Intersection Observer is used in `FloatingImageManager` to pause animation when the container is not visible, improving performance.