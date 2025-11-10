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

  //
  // Tests for assignment 2 additions
  //
  //authenticated users can create a markdown fragment
  test('authenticated users can create a markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/markdown')
      .send('# This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toMatch(/text\/markdown/);
  });

  // authenticated users can create a csv fragment
  test('authenticated users can create a csv fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/csv')
      .send('name,age\nAlice,30\nBob,25');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toMatch(/text\/csv/);
  });

  //authenticated users can create an html fragment
  test('authenticated users can create an html fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/html')
      .send('<h1>This is a fragment</h1>');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toMatch(/text\/html/);
  });

  // authenticated users can create a json fragment
  test('authenticated users can create a json fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'Alice', age: 30 }));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toMatch(/application\/json/);
  });

  // authenticated users can create a yaml fragment
  test('authenticated users can create a yaml fragment', async () => {
    const yamlData = `
    name: Alice
    age: 30
    `;
    const res = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'application/yaml')
      .send(yamlData);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toMatch(/application\/yaml/);
  });
  //
  // end of assignment 2 additions
  //

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
