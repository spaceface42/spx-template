function logMessage(level, ...args) {
  const styles = {
    info:  { emoji: '•', color: 'gray' },
    warn:  { emoji: 'doh!', color: 'orange' },
    error: { emoji: 'grrr', color: 'red' }
  };

  // Check if last arg is a config object
  const lastArg = args[args.length - 1];
  const hasConfig = typeof lastArg === 'object' && lastArg !== null && 'production' in lastArg;

  const config = hasConfig ? args.pop() : { production: false };
  const isProduction = config.production;

  if (isProduction && level === 'info') return;

  const message = args.join(' '); // Combine message parts
  const { emoji, color } = styles[level] || styles.info;

  console.log(
    `%c[ spaceface ] %c${emoji} ${message}`,
    'color: gray; font-weight: normal;',
    `color: ${color}; font-weight: normal;`
  );
}

export { logMessage };
