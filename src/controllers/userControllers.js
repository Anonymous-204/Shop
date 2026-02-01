const userService = require('../services/userService');
const getMe = async (req, res) => {
  try {
  const { id } = req.user;
  const { user_name, avatar_url } = await userService.getMe(id);
  return res.json({ id, user_name, avatar_url });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
const getInfo = async (req, res) => {
  try {
    const id = req.user.id;
    const info = await userService.getProfileById(id);
    return res.json(info);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { user_name, email, bio, avatar_url } = req.body;

    await userService.updateUserProfile(userId, {
      user_name,
      email,
      bio,
      avatar_url
    });

    return res.json({ message: 'Cập nhật thông tin người dùng thành công' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getMe,
  getInfo,
  updateUserProfile
};
