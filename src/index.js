const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const port = process.env.PORT || 3000;
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./lib/db');
//========================SOCKETIO=========================//
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("msg", data => {
    console.log("Client:", data);
    socket.emit("reply", "Server nhận rồi");
  });
});
//========================ROUTER==========================//
const productRoutes = require('./routes/productRoutes')
const cartRoutes = require('./routes/cartRoutes')
const orderRoutes = require('./routes/orderRoutes')




connectDB(); // chỉ gọi 1 lần khi start server
dotenv.config();
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(express.json());
app.engine(
  'hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
  })
);
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'hbs');

// public routes

app.use('/api/auth', authRoutes);
app.get('/signin', (req, res) => {
  res.render('signIn', {
    layout: false
  });
});
app.get('/signup', (req, res) => {
  res.render('signUp',{
    layout: false
  });
});
app.get('/change', (req, res) => {
  res.render('change',{
    layout: false
  });
});

//=====================PAGE=====================//
app.get('/order',(req,res)=>res.render('order'))
app.get('/product',(req, res) => res.render('product'))
app.get('/cart', (req, res)=> res.render('cart'))
app.get('/profile', (req,res)=> res.render('profile'))
app.get('/', (req, res) => res.render('home'));

// private routes
app.use('/api/product', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/user', userRoutes)

// app.listen(port, () => {console.log(`Server running on port ${port}`);});
server.listen(port, () => {
  console.log(`Server + Socket running on port ${port}`);
});

