function logMessage(level, message) {
  const styles = {
    info:  { emoji: '•', color: 'gray' },
    warn:  { emoji: ' doh! ', color: 'orange' },
    error: { emoji: ' grrr ', color: 'red' }
  };

  const { emoji, color } = styles[level] || styles.info;

  console.log(
    `%c[ spaceface ] %c${emoji} ${message}`,
    'color: gray; font-weight: light;',
    `color: ${color}; font-weight: light;`
  );
}

export { logMessage };