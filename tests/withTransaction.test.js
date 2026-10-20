const pool = require('../src/db/pool');
const withTransaction = require('../src/db/withTransaction');

jest.mock('../src/db/pool', () => ({
  connect: jest.fn(),
}));

describe('withTransaction', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  it('handles success: executes BEGIN then COMMIT in order, passes client to fn, returns result, and calls release once with no argument', async () => {
    mockClient.query.mockResolvedValue({});
    const fnResult = { success: true };
    const fn = jest.fn().mockResolvedValue(fnResult);

    const result = await withTransaction(fn);

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(fn).toHaveBeenCalledWith(mockClient);
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(mockClient.release).toHaveBeenCalledWith();
    expect(result).toBe(fnResult);
  });

  it('handles fn error: executes BEGIN then ROLLBACK with no COMMIT, rethrows original error, and calls release once with no argument', async () => {
    mockClient.query.mockResolvedValue({});
    const error = new Error('Function failed');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withTransaction(fn)).rejects.toThrow(error);

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(fn).toHaveBeenCalledWith(mockClient);
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(mockClient.release).toHaveBeenCalledWith();
  });

  it('handles rollback error: rethrows original error, and calls release once with the rollback error', async () => {
    const originalError = new Error('Operation failed');
    const rollbackError = new Error('Rollback failed');

    mockClient.query.mockImplementation(async (sql) => {
      if (sql === 'BEGIN') return {};
      if (sql === 'ROLLBACK') throw rollbackError;
      return {};
    });

    const fn = jest.fn().mockRejectedValue(originalError);

    await expect(withTransaction(fn)).rejects.toThrow(originalError);

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(fn).toHaveBeenCalledWith(mockClient);
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(mockClient.release).toHaveBeenCalledWith(rollbackError);
  });
});
