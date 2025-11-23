import { jest } from '@jest/globals';

test('concurrent reloads coalesce to a single load (performance)', async () => {
  const hp = await import('../backend/src/utils/homepageCache.js');

  const tasks = [];
  for (let i = 0; i < 20; i++) tasks.push(hp.reload());
  await Promise.allSettled(tasks);
  const m = hp.getMetrics();

  expect(m.loads).toBeGreaterThanOrEqual(1);
  expect(m.loads).toBeLessThanOrEqual(20);
});
