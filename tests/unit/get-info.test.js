const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info', () => {
  const auth = { user: 'user1@email.com', pass: 'password1' };

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123/info').auth('bad', 'creds').expect(401));

  test('authenticated user can get their fragment info by id', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('This is a test fragment for info');

    const id = postRes.body.fragment.id;

    // Now get its info
    const getRes = await request(app).get(`/v1/fragments/${id}/info`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragment.id).toBe(id);
    expect(getRes.body.fragment.type).toBe('text/plain');
  });

  test('returns 404 for non-existent fragment info', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth(auth.user, auth.pass);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test("user cannot access another user's fragment info", async () => {
    // User 1 creates a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 fragment for info');

    const id = postRes.body.fragment.id;

    // User 2 tries to access its info
    const getRes = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
  });
});
