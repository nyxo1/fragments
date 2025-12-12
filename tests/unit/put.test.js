// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  const auth = { user: 'user1@email.com', pass: 'password1' };

  test('unauthenticated requests are denied', () =>
    request(app).put('/v1/fragments/123').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).put('/v1/fragments/123').auth('bad', 'creds').expect(401));

  test('authenticated user can update their fragment with same type', async () => {
    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const id = postRes.body.fragment.id;

    // Update it with same type
    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment.id).toBe(id);
    expect(putRes.body.fragment.type).toMatch(/text\/plain/);

    // Verify the content was updated
    const getRes = await request(app).get(`/v1/fragments/${id}`).auth(auth.user, auth.pass);
    expect(getRes.text).toBe('Updated content');
  });

  test('can update markdown to HTML (allowed conversion)', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/markdown')
      .send('# Original');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/html')
      .send('<h1>Updated</h1>');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.type).toMatch(/text\/html/);
  });

  test('returns 400 for invalid type conversion', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Plain text');

    const id = postRes.body.fragment.id;

    // Try to convert plain text to JSON (not allowed)
    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/json')
      .send('{"key": "value"}');

    expect(putRes.statusCode).toBe(400);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.message).toContain('Cannot convert');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .put('/v1/fragments/nonexistent-id')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('data');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('fragment not found');
  });

  test("user cannot update another user's fragment", async () => {
    // User 1 creates a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 fragment');

    const id = postRes.body.fragment.id;

    // User 2 tries to update it
    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send('Updated by user 2');

    expect(putRes.statusCode).toBe(404);
  });

  test('returns 415 for unsupported media type', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Original');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/msword')
      .send('data');

    expect(putRes.statusCode).toBe(415);
    expect(putRes.body.status).toBe('error');
  });

  test('fragment size is updated after PUT', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Short');

    const id = postRes.body.fragment.id;
    const originalSize = postRes.body.fragment.size;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Much longer content here');

    expect(putRes.body.fragment.size).toBeGreaterThan(originalSize);
  });

  test('can convert JSON to YAML (allowed conversion)', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/json')
      .send('{"name": "test"}');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/yaml')
      .send('name: updated');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.type).toMatch(/application\/yaml/);
  });
});
