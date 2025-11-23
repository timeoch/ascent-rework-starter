import { jest } from '@jest/globals';

test('catalog load handles JSON parsing errors (homepageCache.load)', async () => {
  const fs = await import('fs/promises');
  const hpMod = await import('../backend/src/utils/homepageCache.js');

  const spy = jest.spyOn(fs, 'readFile').mockResolvedValue('not-a-json');
  try {
    await expect(hpMod.reload()).rejects.toThrow();
  } finally {
    spy.mockRestore();
  }
});
