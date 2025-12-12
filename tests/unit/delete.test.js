// tests/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  const auth = { user: 'user1@email.com', pass: 'password1' };

  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/123').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).delete('/v1/fragments/123').auth('bad', 'creds').expect(401));

  test('authenticated user can delete their fragment', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Fragment to delete');

    const id = postRes.body.fragment.id;

    // Delete it
    const deleteRes = await request(app).delete(`/v1/fragments/${id}`).auth(auth.user, auth.pass);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
    expect(deleteRes.body.message).toBe('fragment deleted successfully');
  });

  test('deleting a fragment makes it unavailable', async () => {
    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(auth.user, auth.pass)
      .set('Content-Type', 'text/plain')
      .send('Will be deleted');

    const id = postRes.body.fragment.id;

    // Delete it
    await request(app).delete(`/v1/fragments/${id}`).auth(auth.user, auth.pass);

    // Try to get it - should return 404
    const getRes = await request(app).get(`/v1/fragments/${id}`).auth(auth.user, auth.pass);

    expect(getRes.statusCode).toBe(404);
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .delete('/v1/fragments/nonexistent-id')
      .auth(auth.user, auth.pass);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('fragment not found');
  });

  test("user cannot delete another user's fragment", async () => {
    // User 1 creates a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 fragment');

    const id = postRes.body.fragment.id;

    // User 2 tries to delete it
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2');

    expect(deleteRes.statusCode).toBe(404);
  });
});
