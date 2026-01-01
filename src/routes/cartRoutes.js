const express = require('express');
const router = express.Router();
const protectedRoute = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartControllers');
router.use(protectedRoute)
router.get('/', cartController.getMyCart);//Lấy giỏ hàng ACTIVE của user
router.post('/', cartController.addToCart);//Thêm sản phẩm vào giỏ / tăng số lượng
router.put('/', cartController.updateCart);//Cập nhật số lượng nhiều sản phẩm
router.delete('/', cartController.clearCart)//xóa cart
router.delete('/:cartItemId', cartController.deleteCartItem);//Xóa 1 sản phẩm khỏi giỏ
module.exports = router;
