import request from 'supertest';

let app;
beforeAll(async () => {
  const mod = await import('../backend/src/server.js');
  app = mod.default;
});

test('full integration: frontend would fetch homepage (API reachable)', async () => {
  const res = await request(app).get('/api/content/homepage').expect(200);
  expect(res.body.success).toBe(true);
});
