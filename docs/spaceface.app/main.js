/**
 * main.js - Page-aware initialization (Simple & Clean)
 */
import { Spaceface } from './Spaceface.js';

// Simple configuration
const app = new Spaceface({
    features: {
        screensaver: { delay: 3000 },
        randomTheme: {
            themes: [
                '/spaceface.app/spacesuit/random/one.css',
                '/spaceface.app/spacesuit/random/two.css',
                '/spaceface.app/spacesuit/random/three.css'
            ]
        },
        serviceWorker: true
    }
});

// Initialize everything - it automatically detects page type and loads accordingly
app.init();

// Setup SPX
const domReady = app.setupSPX();

// Export for external access
// export { app };

/*
HTML Usage:

Method 1 (Recommended): Use data-page attribute
<body data-page="dashboard">
<body data-page="product">
<body data-page="admin">

Method 2: Use specific elements for detection
<div data-dashboard>Dashboard content</div>
<div data-product-id="123">Product content</div>

Method 3: Let it auto-detect from URL path
/dashboard -> loads dashboard features
/products/123 -> loads product features
/admin -> loads admin features

CSS Classes added automatically:
.js-enabled (JS is available)
.page-dashboard (on dashboard pages)
.page-product (on product pages)
etc.
*/