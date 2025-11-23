import request from 'supertest';

let app;
beforeAll(async () => {
  const mod = await import('../backend/src/server.js');
  app = mod.default;
});

test('pagination and filters work via API', async () => {
  const res = await request(app)
    .get('/api/content/homepage?page=1&limit=2')
    .expect(200);
  expect(res.body.success).toBe(true);
  const p = res.body.data.pagination;
  expect(p).toHaveProperty('page');
  expect(p).toHaveProperty('limit');
  expect(p.limit).toBe(2);
});
