/**
 * ContentRevealer.js - ESM class to handle revealing content on click.
 *
 * This class attaches a single delegated click event listener to the document.
 * When an element with the [data-id-reference] attribute is clicked, it:
 *   - Prevents the default link behavior.
 *   - Reveals the referenced content by toggling configurable CSS classes.
 *   - Optionally unwraps (removes) the clicked element, leaving its children in place.
 *
 * The behavior can be customized via constructor options:
 *   - onClass: Class to add when revealing content (default: 'on')
 *   - offClass: Class to remove when revealing content (default: 'off')
 *   - unwrap: Whether to unwrap the clicked element (default: false)
 *   - addVisitedClass: Whether to add a 'visited' class to clicked element (default: true)
 *   - ensureExists: Check DOM for target elements before initializing (default: false)
 *   - selector: Custom selector for trigger elements (default: '[data-id-reference]')
 */
export class ContentRevealer {
  #onClass;
  #offClass;
  #shouldUnwrap;
  #addVisitedClass;
  #selector;
  #clickHandler;
  #isInitialized = false;

  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.onClass='on'] - Class to add when revealing
   * @param {string} [options.offClass='off'] - Class to remove when revealing
   * @param {boolean} [options.unwrap=false] - Whether to unwrap the clicked element
   * @param {boolean} [options.addVisitedClass=true] - Whether to add a 'visited' class
   * @param {boolean} [options.ensureExists=false] - Check DOM for target elements before initializing
   * @param {string} [options.selector='[data-id-reference]'] - Custom selector for trigger elements
   */
  constructor(options = {}) {
    this.#onClass = options.onClass ?? 'on';
    this.#offClass = options.offClass ?? 'off';
    this.#shouldUnwrap = options.unwrap === true;
    this.#addVisitedClass = options.addVisitedClass !== false;
    this.#selector = options.selector ?? '[data-id-reference]';
    
    // Pre-bind the event handler
    this.#clickHandler = this.#handleClickEvent.bind(this);
    
    // Auto-initialize based on ensureExists option
    const ensureExists = options.ensureExists === true;
    if (!ensureExists || this.#hasTargetElements()) {
      this.init();
    }
  }

  /**
   * Check if target elements exist in the DOM
   * @returns {boolean} Whether target elements exist
   */
  #hasTargetElements() {
    return document.querySelector(this.#selector) !== null;
  }

  /**
   * Initialize the reveal functionality.
   * Attaches a delegated click listener to the document.
   * @returns {boolean} Whether initialization was successful
   */
  init() {
    if (this.#isInitialized) {
      console.warn('ContentRevealer is already initialized');
      return false;
    }

    document.addEventListener('click', this.#clickHandler, { passive: false });
    this.#isInitialized = true;
    return true;
  }

  /**
   * Remove event listeners to prevent memory leaks
   */
  destroy() {
    if (this.#isInitialized) {
      document.removeEventListener('click', this.#clickHandler);
      this.#isInitialized = false;
    }
  }

  /**
   * Check if the revealer is currently active
   * @returns {boolean} Whether the revealer is initialized
   */
  get isActive() {
    return this.#isInitialized;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration object
   */
  get config() {
    return {
      onClass: this.#onClass,
      offClass: this.#offClass,
      unwrap: this.#shouldUnwrap,
      addVisitedClass: this.#addVisitedClass,
      selector: this.#selector
    };
  }

  /**
   * Handle click event (delegated)
   * @param {Event} e - The click event object
   */
  #handleClickEvent(e) {
    const elem = e.target.closest(this.#selector);
    if (!elem) return;
    
    e.preventDefault();
    
    const targetId = this.#getTargetId(elem);
    if (!targetId) {
      console.warn('No target ID found on clicked element:', elem);
      return;
    }
    
    try {
      const success = this.#toggleTargetVisibility(targetId);
      
      if (success) {
        if (this.#addVisitedClass) {
          elem.classList.add('visited');
        }
        
        if (this.#shouldUnwrap) {
          this.#unwrap(elem);
        }
      }
    } catch (error) {
      console.error('Error handling content reveal:', error);
    }
  }

  /**
   * Get target ID from element's data attribute
   * @param {HTMLElement} elem - The clicked element
   * @returns {string|null} The target ID or null
   */
  #getTargetId(elem) {
    // Optimize: dataset.idReference is faster than getAttribute
    return elem.dataset.idReference || null;
  }

  /**
   * Toggle the visibility class of the target element.
   * @param {string} targetId - The ID of the target element
   * @returns {boolean} Whether the toggle was successful
   */
  #toggleTargetVisibility(targetId) {
    if (!targetId) return false;
    
    const target = document.getElementById(targetId);
    if (!target) {
      console.warn(`Target element with ID "${targetId}" not found`);
      return false;
    }
    
    const wasVisible = target.classList.contains(this.#onClass);
    const isNowVisible = !wasVisible;
    
    // Optimize: Use toggle with force parameter when possible
    if (this.#onClass === 'on' && this.#offClass === 'off') {
      target.classList.toggle('on', isNowVisible);
      target.classList.toggle('off', !isNowVisible);
    } else {
      // Fallback for custom classes
      if (isNowVisible) {
        target.classList.remove(this.#offClass);
        target.classList.add(this.#onClass);
      } else {
        target.classList.remove(this.#onClass);
        target.classList.add(this.#offClass);
      }
    }
    
    // Update ARIA attributes for accessibility
    target.setAttribute('aria-hidden', String(!isNowVisible));
    
    // Dispatch custom event for external observers
    this.#dispatchToggleEvent(target, targetId, isNowVisible);
    
    return true;
  }

  /**
   * Dispatch custom toggle event
   * @param {HTMLElement} target - The target element
   * @param {string} targetId - The target ID
   * @param {boolean} isVisible - Whether the target is now visible
   */
  #dispatchToggleEvent(target, targetId, isVisible) {
    const event = new CustomEvent('contentrevealer:toggle', {
      detail: { 
        visible: isVisible, 
        targetId,
        revealer: this 
      },
      bubbles: true
    });
    
    // Use requestAnimationFrame to ensure DOM changes are complete
    requestAnimationFrame(() => {
      target.dispatchEvent(event);
    });
  }

  /**
   * Utility function to unwrap an element safely.
   * @param {HTMLElement} wrapper - The element to unwrap
   */
  #unwrap(wrapper) {
    if (!wrapper?.parentNode) return;
    
    try {
      const parent = wrapper.parentNode;
      
      // Optimize: Use replaceWith when available (modern browsers)
      if (wrapper.replaceWith) {
        wrapper.replaceWith(...wrapper.childNodes);
      } else {
        // Fallback for older browsers
        const fragment = document.createDocumentFragment();
        while (wrapper.firstChild) {
          fragment.appendChild(wrapper.firstChild);
        }
        parent.replaceChild(fragment, wrapper);
      }
    } catch (error) {
      console.error('Error unwrapping element:', error);
    }
  }

  /**
   * Manually reveal a target by ID
   * @param {string} targetId - The ID of the target to reveal
   * @param {boolean} [forceVisible] - Force visibility state (true=show, false=hide)
   * @returns {boolean} Whether the operation was successful
   */
  revealTarget(targetId, forceVisible) {
    if (typeof forceVisible === 'boolean') {
      const target = document.getElementById(targetId);
      if (!target) {
        console.warn(`Target element with ID "${targetId}" not found`);
        return false;
      }
      
      const isCurrentlyVisible = target.classList.contains(this.#onClass);
      if (isCurrentlyVisible === forceVisible) {
        return true; // Already in desired state
      }
    }
    
    return this.#toggleTargetVisibility(targetId);
  }

  /**
   * Show a target by ID
   * @param {string} targetId - The ID of the target to show
   * @returns {boolean} Whether the operation was successful
   */
  showTarget(targetId) {
    return this.revealTarget(targetId, true);
  }

  /**
   * Hide a target by ID
   * @param {string} targetId - The ID of the target to hide
   * @returns {boolean} Whether the operation was successful
   */
  hideTarget(targetId) {
    return this.revealTarget(targetId, false);
  }

  /**
   * Check if a target is currently visible
   * @param {string} targetId - The ID of the target to check
   * @returns {boolean|null} True if visible, false if hidden, null if not found
   */
  isTargetVisible(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return null;
    return target.classList.contains(this.#onClass);
  }

  /**
   * Get all target IDs that are currently visible
   * @returns {string[]} Array of visible target IDs
   */
  getVisibleTargets() {
    const visibleTargets = [];
    const triggers = document.querySelectorAll(this.#selector);
    
    triggers.forEach(trigger => {
      const targetId = this.#getTargetId(trigger);
      if (targetId && this.isTargetVisible(targetId)) {
        visibleTargets.push(targetId);
      }
    });
    
    return visibleTargets;
  }

  /**
   * Reset all targets to their initial state
   * @param {boolean} [visible=false] - Whether targets should be visible or hidden
   */
  resetAllTargets(visible = false) {
    const triggers = document.querySelectorAll(this.#selector);
    
    triggers.forEach(trigger => {
      const targetId = this.#getTargetId(trigger);
      if (targetId) {
        if (visible) {
          this.showTarget(targetId);
        } else {
          this.hideTarget(targetId);
        }
      }
      
      // Remove visited class from triggers
      if (this.#addVisitedClass) {
        trigger.classList.remove('visited');
      }
    });
  }
}

// Usage example:
// import { ContentRevealer } from './ContentRevealer.js';
// const revealer = new ContentRevealer({ 
//   unwrap: true,
//   ensureExists: true,
//   onClass: 'revealed',
//   offClass: 'hidden'
// });
//
// // Listen for reveal events
// document.addEventListener('contentrevealer:toggle', (e) => {
//   console.log(`Content ${e.detail.targetId} is now ${e.detail.visible ? 'visible' : 'hidden'}`);
// });
//
// // Additional methods:
// revealer.showTarget('myTargetId');
// revealer.hideTarget('myTargetId');
// revealer.getVisibleTargets();
// revealer.resetAllTargets();
//
// // When your SPA navigates away or component unmounts:
// revealer.destroy();