const express = require('express');
const router = express.Router();
const protectedRoute = require('../middlewares/authMiddleware');
const userController = require('../controllers/userControllers')
router.use(protectedRoute)
router.get('/me', userController.getMe);
router.get('/profile', userController.getInfo);
router.patch('/edit', userController.updateUserProfile)


module.exports = router;