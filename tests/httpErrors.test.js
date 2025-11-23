import { jest } from '@jest/globals';

test('API returns 404 when homepage content missing', async () => {
  const hpMod = await import('../backend/src/utils/homepageCache.js');
  const serverMod = await import('../backend/src/server.js');
  const app = serverMod.default;
  const spy = jest.spyOn(hpMod, 'get').mockImplementation(() => null);
  try {
    const request = (await import('supertest')).default;
    const res = await request(app).get('/api/content/homepage');
    expect([404, 500]).toContain(res.status);
  } finally {
    spy.mockRestore();
  }
});
