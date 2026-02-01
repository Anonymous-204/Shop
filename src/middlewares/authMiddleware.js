const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.sendStatus(401);   // 👈 đổi từ 403 → 401
  }
  return res.sendStatus(403);
  }

};
