const { pool: db } = require('../lib/db');

/* ===== CHECKOUT ===== */
const checkOut = async (userId) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [carts] = await conn.query(`
      SELECT id
      FROM carts
      WHERE user_id = ? AND status = 'ACTIVE'
      LIMIT 1
    `, [userId]);

    if (carts.length === 0) {
      throw new Error('Không tìm thấy giỏ hàng');
    }

    const cartId = carts[0].id;

    const [cartItems] = await conn.query(`
      SELECT
        ci.product_id,
        ci.quantity,
        p.price,
        p.stock,
        p.name
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      FOR UPDATE
    `, [cartId]);

    if (cartItems.length === 0) {
      throw new Error('Giỏ hàng trống');
    }

    let total = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        throw new Error(`Sản phẩm ${item.name} không đủ tồn kho`);
      }
      total += item.quantity * item.price;
    }

    const [orderResult] = await conn.query(`
      INSERT INTO orders (user_id, cart_id, total, status)
      VALUES (?, ?, ?, 'PAID')
    `, [userId, cartId, total]);

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.price]);
    }

    for (const item of cartItems) {
      await conn.query(`
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    await conn.query(`
      UPDATE carts
      SET status = 'COMPLETED'
      WHERE id = ?
    `, [cartId]);

    await conn.commit();
    return { orderId, total };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* ===== GET ORDERS ===== */
const getOrdersByUser = async (userId) => {
  const [rows] = await db.query(`
    SELECT
      o.id           AS order_id,
      o.status,
      o.note,
      o.total,
      o.created_at,
      o.updated_at,

      p.name         AS product_name,
      oi.quantity,
      oi.price       AS item_price
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p     ON p.id = oi.product_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [userId]);

  const ordersMap = {};

  for (const row of rows) {
    if (!ordersMap[row.order_id]) {
      ordersMap[row.order_id] = {
        id: row.order_id,
        status: row.status,
        note: row.note,
        total: row.total,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: []
      };
    }

    ordersMap[row.order_id].items.push({
      product_name: row.product_name,
      quantity: row.quantity,
      price: row.item_price,               // ✅ giá 1 sản phẩm
      line_total: row.quantity * row.item_price // ✅ tổng dòng (tuỳ thích)
    });
  }

  return Object.values(ordersMap);
};


/* 🔴 EXPORT DUY NHẤT – CỰC KỲ QUAN TRỌNG */
module.exports = {
  checkOut,
  getOrdersByUser
};
