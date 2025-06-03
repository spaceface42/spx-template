export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.init();
  }

  // Add a route with optional parameters
  add(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  // Initialize router and set up event listeners
  init() {
    this.handleRoute();
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]') || e.target.closest('[data-route]')) {
        e.preventDefault();
        const link = e.target.matches('[data-route]') ? e.target : e.target.closest('[data-route]');
        this.navigate(link.getAttribute('data-route') || link.getAttribute('href'));
      }
    });
  }

  // Navigate to a new route
  navigate(path) {
    if (path !== this.currentRoute) {
      history.pushState(null, '', path);
      this.handleRoute();
    }
  }

  // Handle current route
  handleRoute() {
    const path = window.location.pathname;
    this.currentRoute = path;
    
    // Try exact match first
    if (this.routes.has(path)) {
      this.routes.get(path)(path);
      return;
    }
    
    // Try pattern matching for dynamic routes
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path);
      if (params !== null) {
        handler(path, params);
        return;
      }
    }
    
    // Handle 404 if no route matches
    if (this.routes.has('*')) {
      this.routes.get('*')(path);
    }
  }

  // Match dynamic routes (e.g., /user/:id)
  matchRoute(pattern, path) {
    if (!pattern.includes(':')) return null;
    
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) return null;
    
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }

  // Check if current route matches pattern
  isRoute(pattern) {
    return this.currentRoute === pattern || this.matchRoute(pattern, this.currentRoute) !== null;
  }
}