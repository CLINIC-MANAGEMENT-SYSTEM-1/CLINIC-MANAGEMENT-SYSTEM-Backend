const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const validate = require('../src/common/validate');
const { errorHandler } = require('../src/common/errorHandler');

describe('validate middleware', () => {
  it('returns 400 VALIDATION_ERROR with details when body is invalid and has no data key', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/test-body',
      validate(z.object({ email: z.string().email('Invalid email address') })),
      (req, res) => res.json({ success: true, data: req.body }),
    );
    app.use(errorHandler);

    const res = await request(app).post('/test-body').send({ email: 'x' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: [
          {
            part: 'body',
            field: 'email',
            message: 'Invalid email address',
          },
        ],
      },
    });
    expect(res.body.data).toBeUndefined();
  });

  it('passes valid body to controller with parsed value and strips unknown keys', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test-strip', validate(z.object({ name: z.string() })), (req, res) =>
      res.json({ success: true, data: req.body }),
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/test-strip')
      .send({ name: 'Clinic', extraKey: 'should-be-stripped' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ name: 'Clinic' });
  });

  it('validates query part, coerces value on success, and returns 400 on failure', async () => {
    const app = express();
    app.get(
      '/test-query',
      validate(z.object({ page: z.coerce.number().int().min(1) }), 'query'),
      (req, res) => {
        expect(typeof req.query.page).toBe('number');
        res.json({ page: req.query.page });
      },
    );
    app.use(errorHandler);

    const validRes = await request(app).get('/test-query?page=2');
    expect(validRes.status).toBe(200);
    expect(validRes.body.page).toBe(2);

    const invalidRes = await request(app).get('/test-query?page=0');
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidRes.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          part: 'query',
          field: 'page',
        }),
      ]),
    );
  });

  it('validates params part and returns 400 with part params and field id for bad id', async () => {
    const app = express();
    app.get(
      '/test-params/:id',
      validate(z.object({ id: z.string().uuid() }), 'params'),
      (req, res) => res.json({ id: req.params.id }),
    );
    app.use(errorHandler);

    const res = await request(app).get('/test-params/invalid-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          part: 'params',
          field: 'id',
        }),
      ]),
    );
  });

  it('throws an Error immediately when called with an invalid part', () => {
    expect(() => validate(z.object({}), 'headers')).toThrow(Error);
  });

  it('returns 400 with one detail having field "" for strict schema with extra key', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test-strict', validate(z.object({ name: z.string() }).strict()), (req, res) =>
      res.json({ success: true, data: req.body }),
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/test-strict')
      .send({ name: 'Valid', unknownKey: 'extra' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveLength(1);
    expect(res.body.error.details[0].field).toBe('');
    expect(res.body.error.details[0].part).toBe('body');
  });
});
