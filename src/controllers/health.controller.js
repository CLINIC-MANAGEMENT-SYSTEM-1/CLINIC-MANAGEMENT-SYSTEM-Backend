// EN-03 replaces the inline JSON with the shared response helper and wraps controllers in asyncHandler.
function getHealth(req, res) {
  res.status(200).json({ success: true, data: { status: 'ok' } });
}

module.exports = {
  getHealth,
};
