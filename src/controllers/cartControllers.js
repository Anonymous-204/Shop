const cartService = require('../services/cartServices');

/**
 * GET /api/cart
 * Lấy toàn bộ giỏ hàng ACTIVE của user
 */
const getMyCart = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ middleware auth
    const cart = await cartService.getCartByUserId(userId);

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * DELETE /api/cart/:cartItemId
 * Xóa 1 item khỏi giỏ hàng
 */
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = Number(req.params.cartItemId);

    const deleted = await cartService.deleteCartItemFromCart(
      userId,
      cartItemId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cart item'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * PUT /api/cart
 * Update nhiều cart item (tăng / giảm / xóa khi quantity <= 0)
 * body: { items: [{ cart_item_id, quantity }] }
 */
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'items phải là mảng'
      });
    }

    const result = await cartService.updateCartItems(userId, items);

    return res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * POST /api/cart
 * Thêm sản phẩm vào giỏ / tăng số lượng
 * body: { productId, quantity }
 */
const addToCart = async (req, res) => {
  console.log('🔥 req.user =', req.user);
  console.log('🔥 req.body =', req.body);

  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }

    await cartService.increaseOrAddCartItem(userId, quantity, productId);
    const cart = await cartService.getCartByUserId(userId);

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
const clearCart = async (req,res) =>{
  try {
    const userId = req.user.id
    await cartService.clearCart(userId);
    return res.status(204).json({
      success: true,
      message: 'xóa thành công'
    })
  } catch(err) {
    return res.status(400).json({
      success: false,
      message: 'xóa thất bại'
    })
  }
}
module.exports = {
  getMyCart,
  deleteCartItem,
  updateCart,
  addToCart,
  clearCart
};
