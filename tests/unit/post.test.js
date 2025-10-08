const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  const auth = { user: 'user1@email.com', pass: 'password1' };

  // authenticated vs unauthenticated requests
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('bad', 'creds').expect(401));

  // authenticated users can create a plain text fragment
  test('authenticated users can create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
  });

  // responses include all necessary and expected properties
  test('responses include expected properties and correct values', async () => {
    const data = 'Test fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send(data);

    const f = res.body.fragment;
    expect(f.id).toBeDefined();
    expect(f.ownerId).toBeDefined();
    expect(f.created).toBeDefined();
    expect(f.updated).toBeDefined();
    expect(f.type).toMatch(/text\/plain/);
    expect(f.size).toBe(data.length);
  });

  // POST response includes a Location header with a full URL
  test('POST response includes Location header with full URL', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('data');

    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain('/v1/fragments/');
    expect(res.headers.location).toContain(res.body.fragment.id);
  });

  // trying to create a fragment with an unsupported type errors
  test('unsupported type returns 415 error', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/msword')
      .send('data');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });
});
