export class AppConfig {
  constructor(options = {}) {
    this.config = {
      hostname: window.location.hostname, // Define hostname in config
      production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
      features: options.features ?? {},
      ...options,
    };
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value[k] === undefined) {
        console.log(`_______config key "${key}" is undefined`);
        return undefined;
      }
      value = value[k];
    }

    // console.log('_______config key: ', value);
    return value;
  }
}
