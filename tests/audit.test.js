const audit = require('../src/common/audit');

describe('audit.record', () => {
  it('resolves to undefined and does not call tx.query', async () => {
    const tx = { query: jest.fn() };
    const entry = {
      actor: { id: 'user-1', role: 'admin' },
      action: 'CREATE',
      entity: 'appointment',
      entityId: 'appt-123',
    };

    const result = await audit.record(tx, entry);

    expect(result).toBeUndefined();
    expect(tx.query).not.toHaveBeenCalled();
  });
});
