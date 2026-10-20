const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns status 200 and body exactly { success: true, data: { status: "ok" } }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});
