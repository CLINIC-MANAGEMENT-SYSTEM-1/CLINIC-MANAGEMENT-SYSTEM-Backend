const express = require('express');
const request = require('supertest');
const asyncHandler = require('../src/common/asyncHandler');
const AppError = require('../src/common/AppError');
const { errorHandler, CONSTRAINT_ERRORS } = require('../src/common/errorHandler');
const { sendSuccess } = require('../src/common/response');
const app = require('../src/app');

describe('errorHandler', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete CONSTRAINT_ERRORS.test_unique_key;
  });

  it('1. unexpected error: returns 500 without leaking secrets, stack, or code details and logs once to console.error', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/unexpected',
      asyncHandler(() => {
        throw new Error('boom secret');
      }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).get('/unexpected');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: null,
      },
    });

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('boom secret');
    expect(bodyStr).not.toContain('stack');
    expect(bodyStr).not.toContain('at ');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('GET', '/unexpected', expect.any(Error));
  });

  it('2. asyncHandler forwards both rejected promise and synchronous throw to 500 error envelope', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/sync-error',
      asyncHandler(() => {
        throw new Error('sync failure');
      }),
    );
    testApp.get(
      '/async-error',
      asyncHandler(async () => {
        throw new Error('async failure');
      }),
    );
    testApp.use(errorHandler);

    const syncRes = await request(testApp).get('/sync-error');
    expect(syncRes.status).toBe(500);
    expect(syncRes.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: null,
      },
    });

    const asyncRes = await request(testApp).get('/async-error');
    expect(asyncRes.status).toBe(500);
    expect(asyncRes.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: null,
      },
    });
  });

  it('3. AppError returns status, code, message, and details without calling console.error', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/app-error',
      asyncHandler(() => {
        throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Business rule error', { a: 1 });
      }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).get('/app-error');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Business rule error',
        details: { a: 1 },
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('4. 23505 mapped constraint returns 409 with mapped code and message', async () => {
    CONSTRAINT_ERRORS.test_unique_key = {
      code: 'TEST_CODE',
      message: 'Test constraint message',
    };

    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/mapped-unique',
      asyncHandler(() => {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505';
        err.constraint = 'test_unique_key';
        throw err;
      }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).get('/mapped-unique');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'TEST_CODE',
        message: 'Test constraint message',
        details: null,
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('5. 23505 unmapped constraint returns 409 CONFLICT without leaking constraint name', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/unmapped-unique',
      asyncHandler(() => {
        const err = new Error('duplicate key value');
        err.code = '23505';
        err.constraint = 'unmapped_unique_idx';
        throw err;
      }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).get('/unmapped-unique');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Conflict with existing data',
        details: null,
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('unmapped_unique_idx');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('6. 23P01 returns 409 SLOT_TAKEN or PATIENT_DOUBLE_BOOKED according to seeded constraint', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/doctor-overlap',
      asyncHandler(() => {
        const err = new Error('conflicting key value violates exclusion constraint');
        err.code = '23P01';
        err.constraint = 'appt_no_doctor_overlap';
        throw err;
      }),
    );
    testApp.get(
      '/patient-overlap',
      asyncHandler(() => {
        const err = new Error('conflicting key value violates exclusion constraint');
        err.code = '23P01';
        err.constraint = 'appt_no_patient_overlap';
        throw err;
      }),
    );
    testApp.use(errorHandler);

    const docRes = await request(testApp).get('/doctor-overlap');
    expect(docRes.status).toBe(409);
    expect(docRes.body).toEqual({
      success: false,
      error: {
        code: 'SLOT_TAKEN',
        message: 'This appointment slot is already booked',
        details: null,
      },
    });

    const patRes = await request(testApp).get('/patient-overlap');
    expect(patRes.status).toBe(409);
    expect(patRes.body).toEqual({
      success: false,
      error: {
        code: 'PATIENT_DOUBLE_BOOKED',
        message: 'The patient already has another appointment at this time',
        details: null,
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('7. AppError with code "23505" is not treated as a DB error and keeps its own status and code', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/app-error-23505',
      asyncHandler(() => {
        throw new AppError(400, '23505', 'Custom error message', { custom: true });
      }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).get('/app-error-23505');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: '23505',
        message: 'Custom error message',
        details: { custom: true },
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('8. real app: unknown route GET /api/nope returns 404 NOT_FOUND in envelope', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        details: null,
      },
    });
    expect(res.body.data).toBeUndefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('9. real app: malformed JSON to POST /api/health returns 400 VALIDATION_ERROR with Invalid JSON payload', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload',
        details: null,
      },
    });
    expect(res.body.data).toBeUndefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('10. real app: body over 100kb returns 413 PAYLOAD_TOO_LARGE', async () => {
    const largePayload = JSON.stringify({ data: 'a'.repeat(101 * 1024) });

    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload too large',
        details: null,
      },
    });
    expect(res.body.data).toBeUndefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('11. sendSuccess sends { success: true, data: null } for null, defaults to status 200, and honors 201', async () => {
    const testApp = express();
    testApp.get('/null-data', (req, res) => sendSuccess(res, null));
    testApp.get('/created', (req, res) => sendSuccess(res, { created: true }, 201));

    const nullRes = await request(testApp).get('/null-data');
    expect(nullRes.status).toBe(200);
    expect(nullRes.body).toEqual({ success: true, data: null });
    expect(nullRes.body.error).toBeUndefined();

    const createdRes = await request(testApp).get('/created');
    expect(createdRes.status).toBe(201);
    expect(createdRes.body).toEqual({
      success: true,
      data: { created: true },
    });
    expect(createdRes.body.error).toBeUndefined();
  });
});
