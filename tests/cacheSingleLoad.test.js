import { jest } from '@jest/globals';

test('cache loads once then serves from cache (metrics.hits increase)', async () => {
  const hp = await import('../backend/src/utils/homepageCache.js');

  await hp.reload();
  const m1 = hp.getMetrics();

  const r1 = await hp.get();
  const m2 = hp.getMetrics();
  expect(m2.hits).toBeGreaterThanOrEqual(m1.hits + 1);

  const r2 = await hp.get();
  const m3 = hp.getMetrics();
  expect(m3.hits).toBeGreaterThanOrEqual(m2.hits + 1);
});
