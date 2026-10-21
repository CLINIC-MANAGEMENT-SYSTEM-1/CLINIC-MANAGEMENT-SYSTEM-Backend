function sendSuccess(res, data, status = 200) {
  const payload = data === undefined ? null : data;
  return res.status(status).json({ success: true, data: payload });
}

function sendError(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = { sendSuccess, sendError };
