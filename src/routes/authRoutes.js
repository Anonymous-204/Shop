const express = require('express');
const router = express.Router();
const { signUp, signIn, signOut, refreshToken, changePassword} = require('../controllers/authControllers');
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);
router.patch('/change', changePassword);
router.post('/refreshToken', refreshToken);
module.exports = router;