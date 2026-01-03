const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers')
const protectedRoute = require('../middlewares/authMiddleware');

router.get('/search', productController.searchProducts);
router.get('/all', productController.getAllPublicProduct);
router.get('/meta',protectedRoute, productController.getProductMeta);

router.get('/products',protectedRoute, productController.getProductByuserId);
router.post('/create',protectedRoute, productController.createProducts);
//=================== DYNAMIC (ĐỂ CUỐI) =======//
router.patch('/:productId',protectedRoute, productController.updateProducts);
router.delete('/:productId',protectedRoute, productController.deleteProductByProductId);
router.get('/:productId', productController.getPublicProductDetail);
module.exports = router;