const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  const auth = { user: 'user1@email.com', pass: 'password1' };

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123').auth('bad', 'creds').expect(401));

  test('authenticated user can get their fragment by id', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('This is a test fragment');

    const id = postRes.body.fragment.id;

    // Now get it
    const getRes = await request(app).get(`/v1/fragments/${id}`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('This is a test fragment');
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app).get('/v1/fragments/nonexistent-id').auth(auth.user, auth.pass);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test("user cannot access another user's fragment", async () => {
    // User 1 creates a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 fragment');

    const id = postRes.body.fragment.id;

    // User 2 tries to access it
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
  });

  //
  //Assign 2 tests
  // ===== NEW: Markdown to HTML conversion tests =====
  //
  test('can convert markdown fragment to HTML with .html extension', async () => {
    const markdown = '# Hello World';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/markdown')
      .send(markdown);

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.html`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/html/);
    expect(getRes.text).toContain('<h1>Hello World</h1>');
  });

  test('returns 415 for unsupported conversion', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Plain text');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.html`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
  });
});
