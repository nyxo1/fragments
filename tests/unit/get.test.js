const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('fragments array includes created fragment ids', async () => {
    const auth = { user: 'user1@email.com', pass: 'password1' };

    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Test fragment');

    const id = postRes.body.fragment.id;

    // Get fragments list
    const getRes = await request(app).get('/v1/fragments').auth(auth.user, auth.pass);

    expect(getRes.body.fragments).toContain(id);
  });

  test('expand=1 returns full fragment objects', async () => {
    const auth = { user: 'user1@email.com', pass: 'password1' };

    // Create a fragment
    await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Expanded test');

    // Get fragments with expand
    const res = await request(app).get('/v1/fragments?expand=1').auth(auth.user, auth.pass);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.fragments)).toBe(true);

    // Check that we got full objects, not just IDs
    if (res.body.fragments.length > 0) {
      const fragment = res.body.fragments[0];
      expect(fragment).toHaveProperty('id');
      expect(fragment).toHaveProperty('ownerId');
      expect(fragment).toHaveProperty('type');
      expect(fragment).toHaveProperty('size');
      expect(fragment).toHaveProperty('created');
      expect(fragment).toHaveProperty('updated');
    }
  });
});
