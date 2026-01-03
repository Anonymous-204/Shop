const productServices = require('../services/productServices');

const createProducts = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ middleware (nếu có)
    const productData = req.body; // Dữ liệu sản phẩm từ client
    const result = await productServices.createProducts(productData, userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getProductByuserId = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ middleware (nếu có)
    const products = await productServices.getProductByuserId(userId);
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getPublicProductDetail = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10); // Lấy productId từ URL
    const product = await productServices.getPublicProductDetail(productId);
    res.status(200).json(product);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const updateProducts = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10); // Lấy productId từ URL
    const updates = req.body; // Dữ liệu cập nhật từ client
    const result = await productServices.updateProducts(updates, productId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteProductByProductId = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10); // Lấy productId từ URL
    const result = await productServices.deleteProductByProductId(productId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllPublicProduct = async (req, res) => {
  try {
    const products = await productServices.getAllPublicProduct();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getProductMeta = async (req, res) => {
  try {
    const data = await productServices.getInfoForProduct();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    const products = await productServices.searchProducts(q);

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};


module.exports = {
  createProducts,//
  getProductByuserId,//
  getPublicProductDetail,
  updateProducts,//
  deleteProductByProductId,//
  getAllPublicProduct, // Export hàm mới
  getProductMeta,//
  searchProducts
};