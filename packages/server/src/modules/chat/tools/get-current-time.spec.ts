import { getCurrentTimeTool } from './get-current-time';

describe('getCurrentTimeTool', () => {
  it('should return current time in UTC by default', async () => {
    const result = await getCurrentTimeTool.execute!(
      {},
      { toolCallId: 'test', messages: [], abortSignal: undefined as any }
    );

    expect(result).toEqual(
      expect.objectContaining({
        timezone: 'UTC',
        datetime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        localTime: expect.any(String),
        unixTimestamp: expect.any(Number),
      })
    );
    expect(result).not.toHaveProperty('error');
  });

  it('should return time in specified timezone', async () => {
    const result = await getCurrentTimeTool.execute!(
      { timezone: 'Asia/Shanghai' },
      { toolCallId: 'test', messages: [], abortSignal: undefined as any }
    );

    expect(result).toEqual(
      expect.objectContaining({
        timezone: 'Asia/Shanghai',
        datetime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        localTime: expect.any(String),
        unixTimestamp: expect.any(Number),
      })
    );
    expect(result).not.toHaveProperty('error');
  });

  it('should return error for invalid timezone', async () => {
    const result = await getCurrentTimeTool.execute!(
      { timezone: 'Invalid/Timezone' },
      { toolCallId: 'test', messages: [], abortSignal: undefined as any }
    );

    expect(result).toEqual(
      expect.objectContaining({
        timezone: 'UTC',
        datetime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        localTime: expect.any(String),
        unixTimestamp: expect.any(Number),
        error: 'Invalid timezone "Invalid/Timezone"',
      })
    );
  });
});
