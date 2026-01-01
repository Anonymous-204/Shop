// controllers/orderController.js
const orderService = require('../services/orderServices');

const checkout = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ auth middleware

    const result = await orderService.checkOut(userId);

    return res.status(201).json({
      message: 'Checkout thành công',
      data: {
        orderId: result.orderId,
        total: result.total
      }
    });

  } catch (error) {
    console.error('[CHECKOUT ERROR]', error.message);

    return res.status(400).json({
      message: error.message
    });
  }
};


// controllers/orderController.js


const getOrders = async (req, res) => {
  try {
    const userId = req.user.id; // từ auth middleware

    const orders = await orderService.getOrdersByUser(userId);

    return res.status(200).json({
      data: orders
    });
  } catch (error) {
    console.error('[GET ORDERS ERROR]', error.message);

    return res.status(500).json({
      message: 'Không thể lấy danh sách đơn hàng'
    });
  }
};

module.exports = {
  checkout,
  getOrders
};