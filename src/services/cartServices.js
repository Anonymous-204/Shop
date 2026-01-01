const { pool: db } = require('../lib/db');

const getCartByUserId = async (userId) =>{
  const [cartItems] = await db.query(`
    SELECT ci.id as cart_item_id, ci.cart_id as cart_id , ci.quantity, p.name as product_name, p.price, p.image, ctgr.name as category_name, br.name as brand_name
    FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id
    JOIN carts c ON ci.cart_id = c.id
    LEFT JOIN categories ctgr ON ctgr.id = p.category_id
    LEFT JOIN brands br ON br.id = p.brand_id
    WHERE c.user_id = ? AND c.status = 'ACTIVE'`,[userId])
  return cartItems;
}

const deleteCartItemFromCart = async (userId, cartItemId) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lấy cart_id và xác thực ownership
    const [[item]] = await conn.query(`
      SELECT ci.cart_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
      FOR UPDATE
    `, [cartItemId, userId]);

    if (!item) {
      throw new Error('Cart item not found or not owned by user');
    }

    const cartId = item.cart_id;

    // 2. Xóa item
    await conn.query(
      `DELETE FROM cart_items WHERE id = ?`,
      [cartItemId]
    );

    // 3. Kiểm tra cart còn item không
    const [[{ count }]] = await conn.query(
      `SELECT COUNT(*) AS count FROM cart_items WHERE cart_id = ?`,
      [cartId]
    );

    // 4. Nếu cart rỗng → xóa cart
    if (count === 0) {
      await conn.query(
        `DELETE FROM carts WHERE id = ?`,
        [cartId]
      );
    }

    await conn.commit();
    return true;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const checkStockByProductId = async (productId) =>{
  const [stock] = await db.query(`
    SELECT stock FROM product
    WHERE id=?`,[productId])
  if (stock.length===0) throw new Error('sản phầm không tồn tại');
  return stock[0].stock;
}

const updateCartItems = async (userId,items) =>{
  const result = []
  for (const item of items) {
    const [[product]] = await db.query(`
      SELECT p.stock FROM products p
      JOIN cart_items ci ON p.id = ci.product_id
      JOIN carts c ON c.id = ci.cart_id
      WHERE c.user_id = ? AND ci.id =?
      `,[userId, item.cart_item_id])
    if (item.quantity <= 0) {
    await db.query(`DELETE FROM cart_items WHERE id = ?`, [item.cart_item_id])
    result.push({
    cart_item_id: item.cart_item_id,
    status: 'removed',
    message: 'Đã xóa khỏi giỏ hàng'
  });

  continue;
    }

    if(!product){
      result.push({
        cart_item_id: item.cart_item_id,
        status: 'invalid',
        message: 'sản phẩm không tồn tại'
      })
      continue;

    }
    if (item.quantity >product.stock){
      result.push({
        cart_item_id: item.cart_item_id,
        status:'out_of_stock',
        message: `chỉ còn lại ${product.stock} sản phẩm`
      })
      continue;
    }
    await db.query(`
      UPDATE cart_items SET quantity = ?
      WHERE id = ?
      `,[item.quantity,item.cart_item_id])
    result.push({
      cart_item_id: item.cart_item_id,
      status: `ok`
    })
  }
  return result;
}

const increaseOrAddCartItem = async (userId, addQuantity, productId) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1. Check product + lock stock
    const [[product]] = await conn.query(
      `SELECT stock FROM products WHERE id = ? FOR UPDATE`,
      [productId]
    )
    if (!product) throw new Error('Sản phẩm không tồn tại')

    const stock = product.stock

    // 2. Get or create ACTIVE cart (lock)
    let [[cart]] = await conn.query(
      `SELECT id FROM carts 
       WHERE user_id = ? AND status = 'ACTIVE'
       FOR UPDATE`,
      [userId]
    )

    if (!cart) {
      const [rs] = await conn.query(
        `INSERT INTO carts (user_id, status)
         VALUES (?, 'ACTIVE')`,
        [userId]
      )
      cart = { id: rs.insertId }
    }

    // 3. Check cart_item
    const [[item]] = await conn.query(
      `SELECT quantity FROM cart_items
       WHERE cart_id = ? AND product_id = ?
       FOR UPDATE`,
      [cart.id, productId]
    )

    if (!item) {
      const newQty = Math.min(addQuantity, stock)

      await conn.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [cart.id, productId, newQty]
      )
    } else {
      const newQty = item.quantity + addQuantity
      if (newQty > stock) {
        throw new Error('Số lượng sản phẩm vượt quá kho')
      }

      await conn.query(
        `UPDATE cart_items
         SET quantity = ?
         WHERE cart_id = ? AND product_id = ?`,
        [newQty, cart.id, productId]
      )
    }

    await conn.commit()

    return; //await getCartByUserId(userId)

  } catch (err) {
    console.error('❌ increaseOrAddCartItem', {
    userId,
    productId,
    addQuantity,
    message: err.message,
    stack: err.stack
    });
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
const clearCart = async (userId) => {
  
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lấy cart ACTIVE
    const [[cart]] = await conn.query(
      `SELECT id FROM carts WHERE user_id = ? AND status = 'ACTIVE' FOR UPDATE`,
      [userId]
    );

    if (!cart) {
      await conn.commit();
      return res.json({ success: true });
    }

    // 2. Xóa toàn bộ item
    await conn.query(
      `DELETE FROM cart_items WHERE cart_id = ?`,
      [cart.id]
    );

    // 3. xóa luôn cart
    await conn.query(
      `DELETE FROM carts WHERE id = ?`,
      [cart.id]
    );

    await conn.commit();
    res.json({ success: true });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


module.exports = {
  getCartByUserId,
  deleteCartItemFromCart,
  updateCartItems,
  increaseOrAddCartItem,
  clearCart
};
