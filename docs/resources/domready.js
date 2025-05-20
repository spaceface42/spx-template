// domReady.js
export default class DOMReady {
  static #promise = null;

  static ready() {
    if (!this.#promise) {
      this.#promise = new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        } else {
          resolve();
        }
      });
    }
    return this.#promise;
  }
}
