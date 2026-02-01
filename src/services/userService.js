const { pool: db } = require('../lib/db');
const getMe = async (userId) => {
  const [[data]] = await db.query(
    `SELECT id, user_name, avatar_url FROM users WHERE id = ?`,
    [userId]
  );
  if (!data) throw new Error('Không tìm thấy user');
  return data;
};
const getProfileById = async (userId) => {
  const [[data]] = await db.query(
    `SELECT id, user_name, email, bio, role, created_at, updated_at, avatar_url
     FROM users
     WHERE id = ?`,
    [userId]
  );

  if (!data) throw new Error('Không tìm thấy user');

  return { data, message: `Lấy thông tin user ${data.id} thành công` };
};

const updateUserProfile = async (userId, payload) => {
  if (!userId) throw new Error('Thiếu userId');

  const { user_name, email, bio, avatar_url } = payload;

  // ================= USERNAME =================
  if (user_name !== undefined) {
    const cleanUsername = user_name.trim();

    if (cleanUsername.length < 3)
      throw new Error('Username quá ngắn (tối thiểu 3 ký tự)');

    const [[existingUsername]] = await db.query(
      `SELECT 1 FROM users WHERE user_name = ? AND id != ? LIMIT 1`,
      [cleanUsername, userId]
    );

    if (existingUsername) throw new Error('Username đã tồn tại');
  }

  // ================= EMAIL =================
  if (email !== undefined) {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail))
      throw new Error('Email không hợp lệ');

    const [[existingEmail]] = await db.query(
      `SELECT 1 FROM users WHERE email = ? AND id != ? LIMIT 1`,
      [cleanEmail, userId]
    );

    if (existingEmail) throw new Error('Email đã được sử dụng');
  }

  // ================= BIO =================
  if (bio !== undefined) {
    if (typeof bio !== 'string') throw new Error('Bio không hợp lệ');
    if (bio.length > 500) throw new Error('Bio quá dài (tối đa 500 ký tự)');
  }

  // ================= AVATAR =================
  if (avatar_url !== undefined) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(avatar_url))
      throw new Error('Link avatar không hợp lệ');
  }

  // ================= BUILD UPDATE =================
  const updateData = {};
  if (user_name !== undefined) updateData.user_name = user_name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url.trim();

  if (Object.keys(updateData).length === 0)
    throw new Error('Không có dữ liệu cần cập nhật');

  const [result] = await db.query(
    `UPDATE users SET ? WHERE id = ?`,
    [updateData, userId]
  );

  if (result.affectedRows === 0)
    throw new Error('Không tìm thấy người dùng');

  return { message: 'Cập nhật thông tin cá nhân thành công' };
};

module.exports = {
  getMe,
  updateUserProfile,
  getProfileById
};
