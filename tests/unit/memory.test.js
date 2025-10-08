const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('memory data access layer', () => {
  // Test data
  const testOwnerId = 'user123';
  const testFragmentId = 'fragment456';
  const testFragment = {
    ownerId: testOwnerId,
    id: testFragmentId,
    type: 'text/plain',
    size: 256,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
  };

  describe('writeFragment() and readFragment()', () => {
    test('writeFragment() saves a fragment successfully', async () => {
      await expect(writeFragment(testFragment)).resolves.toBe(undefined);
    });

    test('readFragment() returns undefined for non-existent fragment', async () => {
      const result = await readFragment('nonexistent', 'fake-id');
      expect(result).toBe(undefined);
    });

    test('readFragment() retrieves a written fragment', async () => {
      const fragment = {
        ownerId: 'owner1',
        id: 'id1',
        type: 'text/markdown',
        size: 100,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      await writeFragment(fragment);
      const result = await readFragment('owner1', 'id1');

      expect(result).toEqual(fragment);
    });

    test('readFragment() returns parsed JSON object', async () => {
      const fragment = {
        ownerId: 'owner2',
        id: 'id2',
        type: 'application/json',
        size: 50,
        created: '2024-01-02T00:00:00.000Z',
        updated: '2024-01-02T00:00:00.000Z',
      };

      await writeFragment(fragment);
      const result = await readFragment('owner2', 'id2');

      expect(typeof result).toBe('object');
      expect(result.ownerId).toBe('owner2');
      expect(result.id).toBe('id2');
    });

    test('writeFragment() overwrites existing fragment', async () => {
      const fragment1 = {
        ownerId: 'owner3',
        id: 'id3',
        type: 'text/plain',
        size: 100,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      const fragment2 = {
        ...fragment1,
        size: 200,
        updated: '2024-01-02T00:00:00.000Z',
      };

      await writeFragment(fragment1);
      await writeFragment(fragment2);
      const result = await readFragment('owner3', 'id3');

      expect(result.size).toBe(200);
      expect(result.updated).toBe('2024-01-02T00:00:00.000Z');
    });
  });

  describe('writeFragmentData() and readFragmentData()', () => {
    test('writeFragmentData() saves data successfully', async () => {
      await expect(
        writeFragmentData(testOwnerId, testFragmentId, Buffer.from('test data'))
      ).resolves.toBe(undefined);
    });

    test('readFragmentData() returns undefined for non-existent data', async () => {
      const result = await readFragmentData('nonexistent', 'fake-id');
      expect(result).toBe(undefined);
    });

    test('writeFragmentData() and readFragmentData() work with Buffer', async () => {
      const data = Buffer.from('Hello World');
      await writeFragmentData('owner4', 'id4', data);
      const result = await readFragmentData('owner4', 'id4');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('Hello World');
    });

    test('writeFragmentData() and readFragmentData() work with string', async () => {
      const data = 'Plain text data';
      await writeFragmentData('owner5', 'id5', data);
      const result = await readFragmentData('owner5', 'id5');

      expect(result).toBe('Plain text data');
    });

    test('writeFragmentData() overwrites existing data', async () => {
      await writeFragmentData('owner6', 'id6', 'first data');
      await writeFragmentData('owner6', 'id6', 'second data');
      const result = await readFragmentData('owner6', 'id6');

      expect(result).toBe('second data');
    });

    test('writeFragmentData() works with binary data', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      await writeFragmentData('owner7', 'id7', binaryData);
      const result = await readFragmentData('owner7', 'id7');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(binaryData);
    });
  });

  describe('listFragments()', () => {
    test('listFragments() returns empty array when no fragments exist', async () => {
      const result = await listFragments('no-fragments-user');
      expect(result).toEqual([]);
    });

    test('listFragments() returns array of fragment IDs by default', async () => {
      const ownerId = 'owner-list-1';

      await writeFragment({
        ownerId,
        id: 'frag1',
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragment({
        ownerId,
        id: 'frag2',
        type: 'text/html',
        size: 20,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragment({
        ownerId,
        id: 'frag3',
        type: 'image/png',
        size: 30,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });

      const result = await listFragments(ownerId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result).toContain('frag1');
      expect(result).toContain('frag2');
      expect(result).toContain('frag3');
    });

    test('listFragments() with expand=false returns only IDs', async () => {
      const ownerId = 'owner-list-2';

      await writeFragment({
        ownerId,
        id: 'id1',
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });

      const result = await listFragments(ownerId, false);

      expect(result).toEqual(['id1']);
      expect(typeof result[0]).toBe('string');
    });

    test('listFragments() with expand=true returns full fragment objects', async () => {
      const ownerId = 'owner-list-3';
      const fragment = {
        ownerId,
        id: 'expanded-frag',
        type: 'application/json',
        size: 100,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      await writeFragment(fragment);
      const result = await listFragments(ownerId, true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      // Result is an array of serialized JSON strings, need to parse
      const parsed = typeof result[0] === 'string' ? JSON.parse(result[0]) : result[0];
      expect(typeof parsed).toBe('object');
      expect(parsed.id).toBe('expanded-frag');
      expect(parsed.type).toBe('application/json');
      expect(parsed.size).toBe(100);
    });

    test('listFragments() only returns fragments for specified owner', async () => {
      await writeFragment({
        ownerId: 'alice',
        id: 'alice-frag',
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragment({
        ownerId: 'bob',
        id: 'bob-frag',
        type: 'text/plain',
        size: 20,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });

      const aliceFragments = await listFragments('alice');
      const bobFragments = await listFragments('bob');

      expect(aliceFragments).toContain('alice-frag');
      expect(aliceFragments).not.toContain('bob-frag');
      expect(bobFragments).toContain('bob-frag');
      expect(bobFragments).not.toContain('alice-frag');
    });
  });

  describe('deleteFragment()', () => {
    test('deleteFragment() removes both metadata and data', async () => {
      const ownerId = 'owner-delete-1';
      const id = 'delete-frag-1';
      const fragment = {
        ownerId,
        id,
        type: 'text/plain',
        size: 50,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      await writeFragment(fragment);
      await writeFragmentData(ownerId, id, 'fragment data');

      await deleteFragment(ownerId, id);

      const metadata = await readFragment(ownerId, id);
      const data = await readFragmentData(ownerId, id);

      expect(metadata).toBe(undefined);
      expect(data).toBe(undefined);
    });

    test('deleteFragment() throws error if fragment does not exist', async () => {
      // memory-db.del() throws if the key doesn't exist
      await expect(deleteFragment('nonexistent', 'fake-id')).rejects.toThrow();
    });

    test('deleteFragment() only removes specified fragment', async () => {
      const ownerId = 'owner-delete-2';

      await writeFragment({
        ownerId,
        id: 'keep-1',
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData(ownerId, 'keep-1', 'data1'); // Add data so delete doesn't throw

      await writeFragment({
        ownerId,
        id: 'delete-2',
        type: 'text/plain',
        size: 20,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData(ownerId, 'delete-2', 'data2'); // Add data so delete doesn't throw

      await writeFragment({
        ownerId,
        id: 'keep-3',
        type: 'text/plain',
        size: 30,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData(ownerId, 'keep-3', 'data3'); // Add data so delete doesn't throw

      await deleteFragment(ownerId, 'delete-2');

      const fragments = await listFragments(ownerId);

      expect(fragments).toContain('keep-1');
      expect(fragments).toContain('keep-3');
      expect(fragments).not.toContain('delete-2');
      expect(fragments.length).toBe(2);
    });

    test('deleteFragment() returns a Promise', async () => {
      const ownerId = 'promise-test-owner';
      const id = 'promise-test-id';

      // Create fragment and data first so delete doesn't throw
      await writeFragment({
        ownerId,
        id,
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData(ownerId, id, 'test data');

      const result = deleteFragment(ownerId, id);
      expect(result).toBeInstanceOf(Promise);
      await result; // Clean up
    });
  });

  describe('Integration tests', () => {
    test('complete fragment lifecycle: write, read, update, delete', async () => {
      const ownerId = 'lifecycle-user';
      const id = 'lifecycle-frag';

      // Create fragment
      const fragment = {
        ownerId,
        id,
        type: 'text/markdown',
        size: 100,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };
      await writeFragment(fragment);
      await writeFragmentData(ownerId, id, '# Hello World');

      // Read fragment
      let result = await readFragment(ownerId, id);
      expect(result.id).toBe(id);

      let data = await readFragmentData(ownerId, id);
      expect(data).toBe('# Hello World');

      // Update fragment
      fragment.size = 200;
      fragment.updated = '2024-01-02T00:00:00.000Z';
      await writeFragment(fragment);
      await writeFragmentData(ownerId, id, '# Updated Content');

      result = await readFragment(ownerId, id);
      expect(result.size).toBe(200);

      data = await readFragmentData(ownerId, id);
      expect(data).toBe('# Updated Content');

      // Delete fragment
      await deleteFragment(ownerId, id);

      result = await readFragment(ownerId, id);
      data = await readFragmentData(ownerId, id);
      expect(result).toBe(undefined);
      expect(data).toBe(undefined);
    });

    test('multiple users can have fragments with same ID', async () => {
      const id = 'shared-id';

      await writeFragment({
        ownerId: 'user1',
        id,
        type: 'text/plain',
        size: 10,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData('user1', id, 'user1 data');

      await writeFragment({
        ownerId: 'user2',
        id,
        type: 'text/html',
        size: 20,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      });
      await writeFragmentData('user2', id, 'user2 data');

      const frag1 = await readFragment('user1', id);
      const data1 = await readFragmentData('user1', id);
      const frag2 = await readFragment('user2', id);
      const data2 = await readFragmentData('user2', id);

      expect(frag1.type).toBe('text/plain');
      expect(data1).toBe('user1 data');
      expect(frag2.type).toBe('text/html');
      expect(data2).toBe('user2 data');
    });
  });
});
