export class AppConfig {
  constructor(options = {}) {
    this.config = {
      production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
      features: options.features ?? {},
      ...options
    };
  }

  get(key) {
    return this.config[key];
  }
}