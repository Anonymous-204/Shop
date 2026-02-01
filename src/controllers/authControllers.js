const authService = require('../services/authServices');

const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

/* ================= ĐĂNG KÝ ================= */
const signUp = async (req, res) => {
  try {
    const { user_name, email, password } = req.body;
    await authService.createUser(user_name, email, password);
    res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/* ================= ĐĂNG NHẬP ================= */
const signIn = async (req, res) => {
  try {
    const { user_name, password } = req.body;
    const { accessToken, refreshToken } =
      await authService.authenticateUser(user_name, password);

    res.cookie('accessToken', accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Đăng nhập thành công' });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
};

/* ================= ĐĂNG XUẤT ================= */
const signOut = async (req, res) => {
  await authService.deleteToken(req.cookies.refreshToken);
  res.clearCookie('accessToken', cookieConfig);
  res.clearCookie('refreshToken', cookieConfig);
  res.json({ message: 'Đăng xuất thành công' });
};

/* ================= LÀM MỚI TOKEN ================= */
const refreshToken = async (req, res) => {
  try {
    const { newAccess, newRefresh } =
      await authService.refreshAccessToken(req.cookies.refreshToken);

    res.cookie('accessToken', newAccess, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefresh, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Làm mới phiên đăng nhập thành công' });
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập hết hạn' });
  }
};

/* ================= ĐỔI MẬT KHẨU ================= */
const changePassword = async (req, res) => {
  try {
    await authService.changePassword(
      req.user.id,
      req.body.oldPassword,
      req.body.newPassword,
      req.body.confirmPassword
    );
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  signUp,
  signIn,
  signOut,
  refreshToken,
  changePassword
};
