export function logMessage(level, ...args) {
    const styles = {
        info:  { emoji: '•', color: 'gray' },
        warn:  { emoji: '⚠️', color: 'orange' },
        error: { emoji: '❌', color: 'red' }
    };

    const lastArg = args[args.length - 1];
    const hasConfig = typeof lastArg === 'object' &&
                     lastArg !== null &&
                     !Array.isArray(lastArg) &&
                     'production' in lastArg;

    const config = hasConfig ? lastArg : { production: false };
    const messageArgs = hasConfig ? args.slice(0, -1) : args;

    if (config.production && level === 'info') return;

    const message = messageArgs.join(' ');
    const { emoji, color } = styles[level] || styles.info;

    console.log(
        `%c[ spaceface ] %c${emoji} ${message}`,
        'color: gray; font-weight: normal;',
        `color: ${color}; font-weight: normal;`
    );
}
