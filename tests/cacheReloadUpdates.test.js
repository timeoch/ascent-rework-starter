import { jest } from '@jest/globals';

test('async cache updates when file content changes (reload)', async () => {
  const fs = await import('fs/promises');
  const hp = await import('../backend/src/utils/homepageCache.js');

  const original = (await hp.get()).data || (await hp.get());

  const fake = JSON.stringify({ hero: { title: 'UPDATED HERO', subtitle: '', cta: { text: '', link: '' } }, formations: [] });
  const spy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(fake);
  try {
    await hp.reload();
    const updated = (await hp.get()).data || (await hp.get());
    expect(updated.hero.title).toBe('UPDATED HERO');
  } finally {
    spy.mockRestore();
  }
});
