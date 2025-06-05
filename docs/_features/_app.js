// _app.js - Example implementation with event system

export async function initApp(eventBus) {
  console.log('App initialization started with event system');
  
  // Set up animation elements
  const animatedElements = document.querySelectorAll('.animated-element');
  let animationControllers = [];

  // Initialize animations
  function initAnimations() {
    animatedElements.forEach((element, index) => {
      const controller = {
        element,
        isRunning: false,
        animationId: null,
        
        start() {
          if (this.isRunning) return;
          this.isRunning = true;
          
          // Example: CSS animation
          this.element.style.animation = 'fadeInOut 2s infinite';
          
          // Or JavaScript animation
          const animate = () => {
            if (!this.isRunning) return;
            
            // Your animation logic here
            this.element.style.transform = `translateX(${Math.sin(Date.now() / 1000) * 50}px)`;
            this.animationId = requestAnimationFrame(animate);
          };
          animate();
        },
        
        stop() {
          this.isRunning = false;
          if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
          }
          this.element.style.animation = '';
        },
        
        restart(options = {}) {
          this.stop();
          
          if (options.smooth) {
            // Smooth restart with slight delay
            setTimeout(() => this.start(), 100);
          } else {
            this.start();
          }
        }
      };
      
      animationControllers.push(controller);
      controller.start();
    });
  }

  // Event listeners for animation control
  function setupEventListeners() {
    // Listen for specific animation restart requests
    eventBus.addEventListener('restart-fade', (event) => {
      console.log('Restarting fade animations');
      animationControllers
        .filter(ctrl => ctrl.element.classList.contains('fade-animation'))
        .forEach(ctrl => ctrl.restart(event.detail.options));
    });

    eventBus.addEventListener('restart-slide', (event) => {
      console.log('Restarting slide animations');
      animationControllers
        .filter(ctrl => ctrl.element.classList.contains('slide-animation'))
        .forEach(ctrl => ctrl.restart(event.detail.options));
    });

    // Listen for all animation restarts
    eventBus.addEventListener('restart-all', (event) => {
      console.log('Restarting all animations');
      animationControllers.forEach(ctrl => ctrl.restart(event.detail.options));
    });

    // Listen for pause/resume from screensaver
    eventBus.addEventListener('pause-background-animations', () => {
      console.log('Pausing background animations');
      animationControllers.forEach(ctrl => ctrl.stop());
    });

    eventBus.addEventListener('resume-background-animations', () => {
      console.log('Resuming background animations');
      animationControllers.forEach(ctrl => ctrl.start());
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        eventBus.dispatchEvent(new CustomEvent('pause-background-animations'));
      } else {
        eventBus.dispatchEvent(new CustomEvent('resume-background-animations'));
      }
    });

    // Listen for user interaction to restart animations
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        eventBus.restartAnimation('all', { smooth: true });
      }, { once: true, passive: true });
    });
  }

  // Initialize everything
  initAnimations();
  setupEventListeners();

  // Emit that app is ready
  eventBus.dispatchEvent(new CustomEvent('app-ready', {
    detail: { 
      animationCount: animationControllers.length,
      timestamp: Date.now()
    }
  }));

  console.log('App initialization completed');
  
  // Return cleanup function for page transitions
  return () => {
    console.log('Cleaning up app animations');
    animationControllers.forEach(ctrl => ctrl.stop());
    animationControllers = [];
  };
}