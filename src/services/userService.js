const { pool: db } = require('../lib/db');
const getProfileById = async (userId) => {
  const [[data]] = await db.query(
    `SELECT id, email, bio, role, created_at, updated_at, avatar_url
     FROM users
     WHERE id = ?`,
    [userId]
  );
  return {data, message: `lấy thông tin user ${data.id} thành công`}
}
const updateUserProfile = async (userId, payload) => {
  if (!userId) {
    throw new Error('Thiếu userId');
  }

  const { username, email, bio } = payload;

  // ================= VALIDATE USERNAME =================
  if (username !== undefined) {
    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
      throw new Error('Username quá ngắn (tối thiểu 3 ký tự)');
    }

    const [[existingUsername]] = await db.query(`
      SELECT 1 FROM users
      WHERE username = ? AND id != ?
      LIMIT 1
    `, [cleanUsername, userId]);

    if (existingUsername) {
      throw new Error('Username đã tồn tại');
    }
  }

  // ================= VALIDATE EMAIL =================
  if (email !== undefined) {
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Email không hợp lệ');
    }

    const [[existingEmail]] = await db.query(`
      SELECT 1 FROM users
      WHERE email = ? AND id != ?
      LIMIT 1
    `, [cleanEmail, userId]);

    if (existingEmail) {
      throw new Error('Email đã được sử dụng');
    }
  }

  // ================= VALIDATE BIO =================
  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      throw new Error('Bio không hợp lệ');
    }
    if (bio.length > 500) {
      throw new Error('Bio quá dài (tối đa 500 ký tự)');
    }
  }

  // ================= BUILD UPDATE DATA =================
  const updateData = {};

  if (username !== undefined) updateData.username = username.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (bio !== undefined) updateData.bio = bio.trim();

  if (Object.keys(updateData).length === 0) {
    throw new Error('Không có dữ liệu cần cập nhật');
  }

  // ================= UPDATE =================
  const [result] = await db.query(`
    UPDATE users
    SET ?
    WHERE id = ?
  `, [updateData, userId]);

  if (result.affectedRows === 0) {
    throw new Error('Không tìm thấy người dùng');
  }

  return {
    message: 'Cập nhật thông tin cá nhân thành công'
  };
};

module.exports = {
  updateUserProfile,
  getProfileById
};
