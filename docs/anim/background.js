import * as THREE from './three.module.js';

/**
 * Modern Background Animation using Three.js
 * Usage: new Background('#bg');
 */
export class Background {
  /**
   * @param {string|HTMLElement} containerSelector - CSS selector or DOM element for the background container.
   */
  constructor(containerSelector = '#bg') {
    this.container =
      typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;

    if (!this.container) throw new Error('Background container not found');

    this.ww = window.innerWidth;
    this.wh = window.innerHeight;
    this.range = 1500;
    // Optimize: Reduce particle count for small screens
    this.pcount = window.innerWidth < 800 ? 800 : 2000;
    this.dDistance = 600;
    this.dRotX = 0;
    this.dRotY = 0;
    this.cameraMode = 'manual';
    this.mousePos = { x: 0, y: 0 };
    this._rafId = null;

    this._init();
  }

  _init() {
    this._setupThree();
    this._setupResizeHandler();
    this._setupMousemove();
    this._render();
  }

  _setupThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.ww / this.wh,
      0.1,
      1500
    );
    this.camera.position.set(0, 0, 600);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.ww, this.wh);
    this.renderer.setClearColor(0xffffff, 1.0); // White background
    this.container.appendChild(this.renderer.domElement);

    this._setupParticles();
  }

  _setupParticles() {
    const positions = [];
    const before = [];
    for (let i = 0; i < this.pcount; i++) {
      const rand1 = Math.random();
      const rand2 = Math.random();
      const theta1 = 360 * rand1 * Math.PI / 180;
      const theta2 = (180 * rand2 - 90) * Math.PI / 180;
      const radius = 380;

      const x = radius * Math.cos(theta2) * Math.sin(theta1);
      const y = radius * Math.sin(theta2);
      const z = radius * Math.cos(theta2) * Math.cos(theta1);

      positions.push(x, y, z);
      before.push({ t1: rand1, t2: rand2 });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.before = before;

    // Use black color and larger size for visibility on white background
    const material = new THREE.PointsMaterial({
      color: 0x000000, // Black particles
      size: 2.5,
      depthTest: false,
      transparent: true
    });

    this.particle = new THREE.Points(geometry, material);
    this.scene.add(this.particle);

    this.pGeometry = geometry;
    this.pMaterial = material;
  }

  _setupResizeHandler() {
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  _resize() {
    this.ww = window.innerWidth;
    this.wh = window.innerHeight;
    if (this.camera && this.renderer) {
      this.camera.aspect = this.ww / this.wh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.ww, this.wh);
    }
  }

  _setupMousemove() {
    this._mousemove = this._mousemove.bind(this);
    window.addEventListener('mousemove', this._mousemove);
  }

  _mousemove(e) {
    this.mousePos.x = (e.clientX / this.ww) * 2 - 1;
    this.mousePos.y = (e.clientY / this.wh) * 2 - 1;
  }

  _render() {
    // Animate particles
    const g = this.pGeometry;
    const before = g.before;
    const positions = g.getAttribute('position');
    const vLength = positions.count;

    for (let i = 0; i < vLength; i++) {
      const b = before[i];

      let pos1 = b.t1 + Math.random() * 0.001 - 0.0005;
      let pos2 = b.t2 + Math.random() * 0.001 - 0.0005;

      if (pos1 > 1) pos1 = 0;
      if (pos2 > 1) pos2 = 0;

      const theta1 = 360 * pos1 * Math.PI / 180;
      const theta2 = (180 * pos2 - 90) * Math.PI / 180;
      const radius = 380;

      const x = radius * Math.cos(theta2) * Math.sin(theta1);
      const y = radius * Math.sin(theta2);
      const z = radius * Math.cos(theta2) * Math.cos(theta1);

      positions.setXYZ(i, x, y, z);

      b.t1 = pos1;
      b.t2 = pos2;
    }

    positions.needsUpdate = true;

    // Camera follows mouse
    const rotX = this.mousePos.x * 180;
    const rotY = this.mousePos.y * 90;
    this.dRotX += (rotX - this.dRotX) * 0.05;
    this.dRotY += (rotY - this.dRotY) * 0.05;

    this.camera.position.x = this.dDistance * Math.sin(this.dRotX * Math.PI / 180);
    this.camera.position.y = this.dDistance * Math.sin(this.dRotY * Math.PI / 180);
    this.camera.position.z = this.dDistance * Math.cos(this.dRotX * Math.PI / 180);

    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    this._rafId = requestAnimationFrame(() => this._render());
  }

  /**
   * Clean up resources and event listeners.
   */
  destroy() {
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('mousemove', this._mousemove);
    this._resize = null;
    this._mousemove = null;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.renderer) {
      this.renderer.dispose?.();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    this.scene = null;
    this.camera = null;
    this.particle = null;
    this.pGeometry = null;
    this.pMaterial = null;
  }
}
