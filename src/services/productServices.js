const { pool: db } = require('../lib/db');
const createProducts = async (products, userId) =>{
    const {sku, name, price, image, description, specification, stock, brand_id, category_id} = products
    if (!sku) throw new Error('thiếu sku');
    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()
        const [[exiting]] = await conn.query(`
            SELECT 1 FROM products
            WHERE sku = ? LIMIT 1
            `,[sku]);
        if (exiting) {throw new Error('trùng sản phẩm có sẵn')};
        if (!name) throw new Error('thiếu tên sản phẩm');
        if (price == null || typeof price !== 'number' || price < 0) {
        throw new Error('giá tiền không hợp lệ');
        }
        
        const data = {
            seller_id:userId,
            sku,
            name,
            price,
            image: image?? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPI-avETiqK8u3G3Q-sTFF4jEw2qdXXtTtdw&s',
            description: description?? null,
            specification: specification?? null,
            stock: stock?? 0,
            brand_id: brand_id?? null,
            category_id: category_id?? null
        }
        if (!Number.isInteger(data.stock) || data.stock < 0) {
        throw new Error('stock không hợp lệ');
        }
        //check brand và category có tồn tại trong database không
        if (data.brand_id !== null) {
            const [[brand]] = await conn.query(`
                SELECT 1 FROM brands
                WHERE id = ? LIMIT 1
                `,[data.brand_id]);
            if (!brand) throw new Error('không tồn tại brand')
        }
        if (data.category_id !== null) {
            const [[category]] = await conn.query(`
                SELECT 1 FROM categories
                WHERE id = ? LIMIT 1
                `,[data.category_id]);
            if (!category) throw new Error('không tồn tại category')
        }
        const [result] = await conn.query(`
            INSERT INTO products SET ?
            `,[data])
        await conn.commit()
        return {
            product_id:result.insertId, 
            message:'đã thêm sản phẩm vào kho thành công'}
    } catch(err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
};
//dùng để hiển thị toàn bộ sản phẩm trong products
//private
const getProductByuserId = async (userId) =>{
    const [data] = await db.query(`
        SELECT * FROM products
        WHERE seller_id =?
        `,[userId])
    return data;
}
const getInfoForProduct = async () => {
    const [brands] = await db.query(`
        SELECT id as brand_id,name as brand_name
        FROM brands `)
    const [categories] = await db.query(`
        SELECT id as category_id,name as category_name
        FROM categories`)
    return {brands,categories}
}
const getAllPublicProduct = async () =>{
    const [products] = await db.query(`
        SELECT id, name, image, price, stock
        FROM products WHERE stock > 0
        `)
    return products;//dùng để show tất cả card khi load trang web
}
const getPublicProductDetail = async (productId) => {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('productId không hợp lệ');
  }

  const [[product]] = await db.query(`
    SELECT
      p.name,p.image,p.price,
      p.description,p.specification,
      br.name as brand_name, ctgr.name as category_name,
      p.updated_at
    FROM products p
    LEFT JOIN categories ctgr ON ctgr.id = p.category_id
    LEFT JOIN brands br ON br.id = p.brand_id
    WHERE p.id = ?`,[productId]);
  if (!product) {
    throw new Error('không tìm thấy sản phẩm');
  }
  return product;
};


const updateProducts = async (news, productId) =>{
    if (Object.keys(news).length === 0) {
    throw new Error('không có dữ liệu cần cập nhật');
    }
    if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('productId không hợp lệ');
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction()
        const [[old]] = await conn.query(`
            SELECt * FROM products
            Where id =?
            `,[productId])
        if (!old) throw new Error('Sản phẩm không tồn tại')

        let price = old.price
        let old_price = old.old_price
        if ('price' in news) {
            if (
            news.price === null ||
            typeof news.price !== 'number' ||
            Number.isNaN(news.price) ||
            news.price < 0
            ) {
            throw new Error('giá tiền không hợp lệ');
            }

            if (news.price !== old.price) {
            old_price = old.price;
            price = news.price;
            }
        }

        const data = {
            name:news.name??old.name,
            price,
            old_price,
            image:news.image?? old.image,
            description: news.description ?? old.description,
            specification: news.specification ?? old.specification,
            stock: news.stock?? old.stock,
            brand_id: news.brand_id?? old.brand_id,
            category_id: news.category_id?? old.category_id
        }
        if (!Number.isInteger(data.stock) || data.stock < 0) {
            throw new Error('stock không hợp lệ');
        }
        if (data.brand_id !== null) {
            const [[brand]] = await conn.query(`
                SELECT 1 FROM brands
                WHERE id = ? LIMIT 1
                `,[data.brand_id]);
            if (!brand) throw new Error('không tồn tại brand')
        }
        if (data.category_id !== null) {
            const [[category]] = await conn.query(`
                SELECT 1 FROM categories
                WHERE id = ? LIMIT 1
                `,[data.category_id]);
            if (!category) throw new Error('không tồn tại category')
        }
        await conn.query(
            `UPDATE products SET ? WHERE id = ?`,
            [data, productId])
        await conn.commit()
        return {product_id:old.id, message:'đã cập nhật sản phẩm trong kho thành công'}       
    } catch(err){
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}
const deleteProductByProductId = async (productId) =>{
    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()
        const [[exiting]] = await conn.query(`
            SELECT 1 FROM products
            WHERE id =?
            LIMIT 1
            `,[productId])
        if (!exiting) throw new Error('Sản phẩm cần xóa không tồn tại')
        await conn.query(`
            DELETE FROM products 
            WHERE id = ?
            `,[productId])
        await conn.commit()
        return {message: 'xóa thành công'}
    } catch(err) {
        await conn.rollback()
        throw err;
    } finally {
        conn.release();
    }
}
const searchProducts = async (keyword) => {
  if (!keyword || !keyword.trim()) {
    return [];
  }

  const search = `%${keyword.trim()}%`;

  const [rows] = await db.query(`
    SELECT id, name, price, image, stock
    FROM products
    WHERE name LIKE ?
      AND stock > 0
    LIMIT 20
  `, [search]);

  return rows;
};
module.exports = {
  createProducts,
  getProductByuserId,
  getInfoForProduct,
  getAllPublicProduct,
  getPublicProductDetail,
  updateProducts,
  deleteProductByProductId,
  searchProducts
}
