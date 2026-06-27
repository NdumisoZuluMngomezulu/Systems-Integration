/**
 * Very small protection for write endpoints. Not a real auth system -
 * just enough so the POST endpoint isn't wide open on a public demo.
 * Send the key in an "x-api-key" header.
 */
module.exports = function requireApiKey(req, res, next) {
  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Server has no ADMIN_API_KEY configured' });
  }

  const key = req.header('x-api-key');
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing x-api-key header' });
  }

  next();
};
