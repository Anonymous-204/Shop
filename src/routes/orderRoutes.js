const express = require('express')
const router = express.Router()
const orderController=require('../controllers/orderControllers')
const protectedRoute = require('../middlewares/authMiddleware');
router.use(protectedRoute)
router.post('/checkout',orderController.checkout) 
router.get('/', orderController.getOrders);
module.exports = router
