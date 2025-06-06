import { eventBus } from '../../bin/EventBus.js';



/*
const styles = {
  info:  { emoji: '•', color: 'gray' },
  warn:  { emoji: '⚠️', color: 'orange' },
  error: { emoji: '❌', color: 'red' },
};

export function logMessageX(level, ...args) {
  const { emoji, color } = styles[level] || styles.info;
  const message = args.join(' ');

  console.log(
    `%c[spaceface]%c${emoji} ${message}`,
    'color: gray; font-weight: normal;',
    `color: ${color}; font-weight: normal;`
  );
}
*/

// Listen to all logs emitted via eventBus and print them
// eventBus.on('log', ({ level, args }) => {
//  logMessage(level, ...args);
// });

// for future event logs
export function logMessage(level = 'info', ...args) {
  eventBus.emit('log', { level, ...args });
}
