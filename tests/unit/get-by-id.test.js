// tests/unit/get-by-id.test.js

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

  test('can convert markdown to plain text', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/markdown')
      .send('# Heading\n**bold**');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
    expect(getRes.text).not.toContain('#');
    expect(getRes.text).not.toContain('**');
  });

  // JSON conversions
  test('can convert JSON to YAML', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/json')
      .send('{"name":"John","age":30}');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.yaml`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(getRes.text).toContain('name:');
    expect(getRes.text).toContain('age:');
  });

  test('can convert JSON to plain text', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/json')
      .send('{"test": "data"}');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
  });

  // CSV conversions
  test('can convert CSV to JSON', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/csv')
      .send('name,age\nAlice,30\nBob,25');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.json`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/application\/json/);
    const data = JSON.parse(getRes.text);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('age');
  });

  test('can convert CSV to plain text', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/csv')
      .send('a,b,c\n1,2,3');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
  });

  // HTML conversions
  test('can convert HTML to plain text', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/html')
      .send('<h1>Title</h1><p>Content</p>');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
    expect(getRes.text).not.toContain('<');
    expect(getRes.text).not.toContain('>');
  });

  // YAML conversions
  test('can convert YAML to plain text', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/yaml')
      .send('name: test\nvalue: 123');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/text\/plain/);
  });

  // Error cases
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

  test('returns 415 for unknown extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('test');

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.unknown`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.error.message).toContain('unsupported');
  });

  // Same type conversions (should return original)
  test('requesting same extension returns original data', async () => {
    const originalContent = 'Plain text content';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send(originalContent);

    const id = postRes.body.fragment.id;
    const getRes = await request(app).get(`/v1/fragments/${id}.txt`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(originalContent);
  });
});
