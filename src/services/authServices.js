const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { pool: db } = require('../lib/db');

dotenv.config();

/* =========================
   CREATE USER
========================= */
const createUser = async (username, email, password) => {
  // check username
  const [userByUsername] = await db.query(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  if (userByUsername.length > 0) {
    throw new Error('Username already exists');
  }

  // check email
  const [userByEmail] = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (userByEmail.length > 0) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    'INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );

  return { message: 'User created successfully' };
};

/* =========================
   SIGN IN
========================= */
const authenticateUser = async (username, password) => {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = rows[0];

  const valid = await bcrypt.compare(password, user.hashed_password);
  if (!valid) {
    throw new Error('Invalid username or password');
  }

  // create refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');

  await db.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [user.id, refreshToken]
  );

  // create access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );


  return { accessToken, refreshToken };
};

/* =========================
   DELETE REFRESH TOKEN (LOGOUT)
========================= */
const deleteRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;

  await db.query(
    'DELETE FROM sessions WHERE refresh_token = ?',
    [refreshToken]
  );
};

/* =========================
   REFRESH ACCESS TOKEN
========================= */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('No refresh token provided');
  }

  const [sessions] = await db.query(
    'SELECT * FROM sessions WHERE refresh_token = ?',
    [refreshToken]
  );

  if (sessions.length === 0) {
    throw new Error('Invalid refresh token');
  }

  const session = sessions[0];

  if (new Date(session.expires_at) < new Date()) {
    throw new Error('Refresh token expired');
  }

  const accessToken = jwt.sign(
    { id: session.user_id },
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );

  return { accessToken };
};

/* =========================
   CHANGE PASSWORD BY USERNAME
========================= */
const changePassword = async (
  username,
  oldPassword,
  newPassword,
  confirmPassword
) => {
  // check confirm
  if (newPassword !== confirmPassword) {
    throw new Error('Confirm password does not match');
  }

  // lấy user theo username
  const [rows] = await db.query(
    'SELECT id, hashed_password FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  const user = rows[0];

  // check mật khẩu cũ
  const isValid = await bcrypt.compare(oldPassword, user.hashed_password);
  if (!isValid) {
    throw new Error('Old password is incorrect');
  }

  // tránh đổi trùng mật khẩu cũ
  const isSame = await bcrypt.compare(newPassword, user.hashed_password);
  if (isSame) {
    throw new Error('New password must be different from old password');
  }

  // hash mật khẩu mới
  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  // update mật khẩu
  await db.query(
    'UPDATE users SET hashed_password = ? WHERE id = ?',
    [newHashedPassword, user.id]
  );

  // xoá toàn bộ session → bắt login lại
  await db.query(
    'DELETE FROM sessions WHERE user_id = ?',
    [user.id]
  );

  return { message: 'Password changed successfully' };
};


module.exports = {
  createUser,
  authenticateUser,
  deleteRefreshToken,
  refreshAccessToken,
  changePassword
};
