import { jsonSchema, tool } from 'ai';

export const getCurrentTimeTool = tool({
  description:
    'Get the current date and time. Optionally specify an IANA timezone.',
  inputSchema: jsonSchema<{ timezone?: string }>({
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description:
          'IANA timezone (e.g. "Asia/Shanghai", "America/New_York"). Defaults to UTC.',
      },
    },
  }),
  execute: async ({ timezone }) => {
    const now = new Date();
    const tz = timezone ?? 'UTC';
    try {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'longOffset',
      }).format(now);
      return {
        datetime: now.toISOString(),
        timezone: tz,
        localTime: formatted,
        unixTimestamp: Math.floor(now.getTime() / 1000),
      };
    } catch {
      return {
        datetime: now.toISOString(),
        timezone: 'UTC',
        localTime: now.toUTCString(),
        unixTimestamp: Math.floor(now.getTime() / 1000),
        error: `Invalid timezone "${tz}"`,
      };
    }
  },
});
