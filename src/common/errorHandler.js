const AppError = require('./AppError');
const { sendError } = require('./response');

const CONSTRAINT_ERRORS = {
  appt_no_doctor_overlap: {
    code: 'SLOT_TAKEN',
    message: 'This appointment slot is already booked',
  },
  appt_no_patient_overlap: {
    code: 'PATIENT_DOUBLE_BOOKED',
    message: 'The patient already has another appointment at this time',
  },
};

function notFoundHandler(req, res) {
  return sendError(res, 404, 'NOT_FOUND', 'Route not found');
}

function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return _next(err);
  }

  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  if (err && err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid JSON payload', null);
  }

  if (err && err.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Payload too large', null);
  }

  if (err && (err.code === '23505' || err.code === '23P01')) {
    const mapping = err.constraint ? CONSTRAINT_ERRORS[err.constraint] : null;
    if (mapping) {
      return sendError(res, 409, mapping.code, mapping.message, null);
    }
    return sendError(res, 409, 'CONFLICT', 'Conflict with existing data', null);
  }

  console.error(req.method, req.originalUrl, err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred', null);
}

module.exports = {
  errorHandler,
  notFoundHandler,
  CONSTRAINT_ERRORS,
};
