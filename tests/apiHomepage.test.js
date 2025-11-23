import request from 'supertest';

let app;
beforeAll(async () => {
  const mod = await import('../backend/src/server.js');
  app = mod.default;
});

test('GET /api/content/homepage returns success and expected shape', async () => {
  const res = await request(app).get('/api/content/homepage').expect(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
  const data = res.body.data;
  expect(data).toHaveProperty('hero');
  expect(data).toHaveProperty('formations');
  expect(Array.isArray(data.formations)).toBe(true);
});
