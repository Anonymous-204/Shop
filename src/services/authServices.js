const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool: db } = require('../lib/db');

/* ================= TẠO NGƯỜI DÙNG ================= */
const createUser = async (user_name, email, password) => {
  const [u1] = await db.query('SELECT id FROM users WHERE user_name=?', [user_name]);
  if (u1.length) throw new Error('Tên đăng nhập đã tồn tại');

  const [u2] = await db.query('SELECT id FROM users WHERE email=?', [email]);
  if (u2.length) throw new Error('Email đã tồn tại');

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users(user_name,email,hashed_password) VALUES(?,?,?)',
    [user_name, email, hash]
  );
};

/* ================= ĐĂNG NHẬP ================= */
const authenticateUser = async (user_name, password) => {
  const [rows] = await db.query('SELECT * FROM users WHERE user_name=?', [user_name]);
  if (!rows.length) throw new Error('Sai tài khoản hoặc mật khẩu');

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.hashed_password);
  if (!valid) throw new Error('Sai tài khoản hoặc mật khẩu');

  const refreshToken = crypto.randomBytes(64).toString('hex');

  await db.query(
    'INSERT INTO sessions(user_id,refresh_token,expires_at) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [user.id, refreshToken]
  );

  const accessToken = jwt.sign(
    { id: user.id, user_name: user.user_name },
    process.env.SECRET_KEY,
    { expiresIn: '15m' }
  );

  return { accessToken, refreshToken };
};

/* ================= ĐĂNG XUẤT ================= */
const deleteToken = async (refreshToken) => {
  if (!refreshToken) return;
  await db.query('DELETE FROM sessions WHERE refresh_token=?', [refreshToken]);
};

/* ================= LÀM MỚI TOKEN (XOAY VÒNG) ================= */
const refreshAccessToken = async (oldToken) => {
  const [rows] = await db.query(
    'SELECT * FROM sessions WHERE refresh_token=?',
    [oldToken]
  );
  if (!rows.length) throw new Error('Token không hợp lệ');

  const session = rows[0];
  if (new Date(session.expires_at) < new Date()) {
    await db.query('DELETE FROM sessions WHERE id=?', [session.id]);
    throw new Error('Phiên đăng nhập hết hạn');
  }

  const newRefresh = crypto.randomBytes(64).toString('hex');

  await db.query(
    'UPDATE sessions SET refresh_token=? WHERE id=?',
    [newRefresh, session.id]
  );

  const newAccess = jwt.sign(
    { id: session.user_id },
    process.env.SECRET_KEY,
    { expiresIn: '15m' }
  );

  return { newAccess, newRefresh };
};

/* ================= ĐỔI MẬT KHẨU ================= */
const changePassword = async (userId, oldPass, newPass, confirm) => {
  if (newPass !== confirm) throw new Error('Mật khẩu xác nhận không khớp');

  const [rows] = await db.query(
    'SELECT hashed_password FROM users WHERE id=?',
    [userId]
  );
  const user = rows[0];

  const valid = await bcrypt.compare(oldPass, user.hashed_password);
  if (!valid) throw new Error('Mật khẩu cũ sai');

  const same = await bcrypt.compare(newPass, user.hashed_password);
  if (same) throw new Error('Mật khẩu mới phải khác mật khẩu cũ');

  const hash = await bcrypt.hash(newPass, 10);

  await db.query('UPDATE users SET hashed_password=? WHERE id=?', [hash, userId]);
  await db.query('DELETE FROM sessions WHERE user_id=?', [userId]);
};

module.exports = {
  createUser,
  authenticateUser,
  deleteToken,
  refreshAccessToken,
  changePassword
};
