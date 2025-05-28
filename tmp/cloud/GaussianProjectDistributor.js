export default class GaussianProjectDistributor {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) throw new Error(`Container ${containerSelector} not found`);
    
    this.links = [...this.container.querySelectorAll('a[href]')];
    this.positions = [];
    this.resizeTimeout = null;
    
    this.init();
  }

  init() {
    this.setupStyles();
    this.distribute();
    this.bindEvents();
  }

  setupStyles() {
    // Ensure container is positioned and has overflow hidden
    const containerStyle = getComputedStyle(this.container);
    if (containerStyle.position === 'static') {
      this.container.style.position = 'relative';
    }
    this.container.style.overflow = 'hidden';

    // Style links for absolute positioning
    this.links.forEach(link => {
      link.style.position = 'absolute';
      link.style.transform = 'translate(-50%, -50%)';
      link.style.transition = 'all 0.3s ease';
      link.style.zIndex = '1';
      
      // Create hover image if data-image exists
      const imageSrc = link.dataset.image;
      if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          max-width: 120px;
          max-height: 120px;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
        `;
        link.appendChild(img);
      }
    });
  }

  // Box-Muller transform for Gaussian distribution
  gaussianRandom(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * stdDev + mean;
  }

  // Check if two circles overlap
  circlesOverlap(x1, y1, x2, y2, minDistance = 60) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy) < minDistance;
  }

  // Generate position with no overlaps
  generatePosition(centerX, centerY, stdDevX, stdDevY, existingPositions, maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.max(30, Math.min(centerX + this.gaussianRandom(0, stdDevX), this.container.offsetWidth - 30));
      const y = Math.max(30, Math.min(centerY + this.gaussianRandom(0, stdDevY), this.container.offsetHeight - 30));
      
      // Check for overlaps
      const hasOverlap = existingPositions.some(pos => 
        this.circlesOverlap(x, y, pos.x, pos.y)
      );
      
      if (!hasOverlap) {
        return { x, y };
      }
    }
    
    // Fallback: find empty space in grid
    return this.findEmptyGridPosition(existingPositions);
  }

  // Fallback grid positioning
  findEmptyGridPosition(existingPositions) {
    const gridSize = 80;
    const cols = Math.floor(this.container.offsetWidth / gridSize);
    const rows = Math.floor(this.container.offsetHeight / gridSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5) * gridSize;
        const y = (row + 0.5) * gridSize;
        
        const hasOverlap = existingPositions.some(pos => 
          this.circlesOverlap(x, y, pos.x, pos.y)
        );
        
        if (!hasOverlap) {
          return { x, y };
        }
      }
    }
    
    // Last resort: random position
    return {
      x: Math.random() * (this.container.offsetWidth - 60) + 30,
      y: Math.random() * (this.container.offsetHeight - 60) + 30
    };
  }

  distribute() {
    const { offsetWidth: width, offsetHeight: height } = this.container;
    
    if (width === 0 || height === 0) return; // Container not visible
    
    const centerX = width / 2;
    const centerY = height / 2;
    const stdDevX = width * 0.2; // 20% of width
    const stdDevY = height * 0.2; // 20% of height
    
    this.positions = [];
    
    this.links.forEach((link, index) => {
      const position = this.generatePosition(
        centerX, 
        centerY, 
        stdDevX, 
        stdDevY, 
        this.positions
      );
      
      this.positions.push(position);
      
      // Apply position with slight delay for smooth animation
      setTimeout(() => {
        link.style.left = `${position.x}px`;
        link.style.top = `${position.y}px`;
        link.style.opacity = '1';
      }, index * 50);
    });
  }

  bindEvents() {
    // Hover events for image display
    this.links.forEach(link => {
      const img = link.querySelector('img');
      if (img) {
        link.addEventListener('mouseenter', () => {
          img.style.opacity = '1';
        });
        
        link.addEventListener('mouseleave', () => {
          img.style.opacity = '0';
        });
      }
    });

    // Resize handler with debouncing
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.distribute(), 250);
    });
  }

  // Public method to manually redistribute
  redistribute() {
    this.distribute();
  }

  // Cleanup method
  destroy() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', this.distribute);
  }
}