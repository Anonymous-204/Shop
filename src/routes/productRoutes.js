const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers')
const protectedRoute = require('../middlewares/authMiddleware');
//=================== PUBLIC ===================//
router.get('/all', productController.getAllPublicProduct);
router.get('/:productId', productController.getPublicProductDetail);
//=================== PRIVATE ==================//
router.use(protectedRoute)

router.get('/meta', productController.getProductMeta);
router.get('/products', productController.getProductByuserId);
router.post('/create', productController.createProducts);

//=================== DYNAMIC (ĐỂ CUỐI) =======//
router.patch('/:productId', productController.updateProducts);
router.delete('/:productId', productController.deleteProductByProductId);

module.exports = router;

