describe('health-check', () => {
  it('should parse PING_INTERVAL correctly', () => {
    const interval = parseInt(process.env.PING_INTERVAL || '3600', 10) * 1000;
    expect(interval).toBe(3600000);
  });

  it('should have correct default values', () => {
    const url = process.env.PING_URL || 'https://sarcasm.wiki/';
    const appName = process.env.PM2_APP_NAME || 'sarcasm-wiki-dev';
    expect(url).toBe('https://sarcasm.wiki/');
    expect(appName).toBe('sarcasm-wiki-dev');
  });
});

