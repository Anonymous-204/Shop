const userService = require('../services/userService')
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
    const { username, email, bio } = req.body;

    await userService.updateUserProfile(userId, { username, email, bio });

    return res.json({ message: 'Cập nhật thông tin người dùng thành công' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

module.exports = {getInfo, updateUserProfile}