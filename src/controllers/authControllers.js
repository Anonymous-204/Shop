const authService = require('../services/authServices');
const dotenv = require('dotenv');

dotenv.config();

const signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Call service to create user
        await authService.createUser(username, email, password);
        return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
}
const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const { accessToken, refreshToken } =
            await authService.authenticateUser(username, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // true khi deploy https
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ accessToken });

    } catch (error) {
        console.error('SIGNIN ERROR:', error.message);

        // ❗ lỗi auth → 401
        if (error.message === 'Invalid username or password') {
            return res.status(401).json({
                message: 'Sai tên đăng nhập hoặc mật khẩu'
            });
        }

        // ❗ lỗi hệ thống
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const signOut = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        await authService.deleteRefreshToken(refreshToken);
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
}
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ message: 'No refresh token provided' });
        }
        const { accessToken } = await authService.refreshAccessToken(refreshToken);

        return res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
}


/* =========================
   CHANGE PASSWORD
========================= */
const changePassword = async (req, res) => {
  try {
    const { username, password, newPassword, confirmPassword } = req.body;

    if (!username || !password || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters'
      });
    }

    await authService.changePassword(
      username,
      password,
      newPassword,
      confirmPassword
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
    signUp,
    signIn,
    signOut,
    changePassword,
    refreshToken
};