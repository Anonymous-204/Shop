const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers')
const protectedRoute = require('../middlewares/authMiddleware');
//=================== PUBLIC ===================//
router.get('/search', productController.searchProducts);
router.get('/all', productController.getAllPublicProduct);
router.get('/meta',protectedRoute, productController.getProductMeta);
router.get('/:productId', productController.getPublicProductDetail);
//=================== PRIVATE ==================//
router.use(protectedRoute)
router.get('/products', productController.getProductByuserId);
router.post('/create', productController.createProducts);
//=================== DYNAMIC (ĐỂ CUỐI) =======//
router.patch('/:productId', productController.updateProducts);
router.delete('/:productId', productController.deleteProductByProductId);
module.exports = router;