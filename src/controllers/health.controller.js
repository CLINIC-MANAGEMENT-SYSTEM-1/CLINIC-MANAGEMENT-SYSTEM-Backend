const asyncHandler = require('../common/asyncHandler');
const { sendSuccess } = require('../common/response');

const getHealth = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: 'ok' });
});

module.exports = {
  getHealth,
};
