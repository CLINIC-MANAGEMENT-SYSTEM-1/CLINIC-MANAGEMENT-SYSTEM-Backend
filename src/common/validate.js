const AppError = require('./AppError');

const ALLOWED_PARTS = ['body', 'query', 'params'];

function validate(schema, part = 'body') {
  if (!ALLOWED_PARTS.includes(part)) {
    throw new Error(`Invalid validation part: ${part}`);
  }

  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        part,
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid input data', details));
    }

    req[part] = result.data;
    next();
  };
}

module.exports = validate;
