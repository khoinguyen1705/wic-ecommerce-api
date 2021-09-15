const express = require("express");
const {User, Product, Order} = require("./model");
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');

const USER_ROLE = 'user';
const ADMIN_ROLE = 'admin';

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

/**
 * POST register API
 */
router.post('/auth/register', async (req, res) => {
  console.log('haha');
  const registerUserReq = req.body;
  if (!registerUserReq.username || !registerUserReq.name || !registerUserReq.password) {
    res.status(400);
    res.json({
      message: 'Invalid request'
    })
    return;
  }
  const foundUser = await User.findOne({
    username: registerUserReq.username,
  });
  if (foundUser) {
    res.status(400);
    res.json({
      message: 'Username is duplicated',
    })
    return;
  }
  const hashedPassword = await bcrypt.hash(registerUserReq.password, 10);
  const saved = await User.create({
    ...registerUserReq,
    password: hashedPassword,
    role: USER_ROLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const {session} = req;
  session.user = saved;
  res.json(saved);
});

/**
 * POST login API
 */
router.post('/auth/login', async (req, res) => {
  const loginUserReq = req.body;
  const foundUser = await User.findOne({
    username: loginUserReq.username,
  });
  if (foundUser) {
    const isMatched = await bcrypt.compare(loginUserReq.password, foundUser.password);
    if (isMatched) {
      req.session.user = foundUser;
      res.json(foundUser);
      return;
    }
  }
  res.status(401);
  res.json({
    message: 'Username or password is incorrect',
  })
});

/**
 * GET products API
 * Query products information
 */
router.get("/products", function (req, res) {
  const {skip, limit, name} = req.query;
  const filterParam = {};
  if (name) {
    filterParam.name = {'$regex': name, '$options': 'i'};
  }
  Product.find(filterParam).skip(skip || 0).limit(limit || 10).then(products => res.json(products));
});

/**
 * POST products API
 * Create new product
 */
router.post("/products", async (req, res) => {
  const base64Image = req.body.image.split(',')[1];
  const imagePath = `public/${new Date().getTime()}`;
  await fs.promises.writeFile(imagePath, base64Image, 'base64');
  Product.create({
    ...req.body,
    image: imagePath,
  }).then(result => res.json(result));
});

/**
 * PUT products API
 * Update product by ID
 */
router.put("/products/:productId", async (req, res) => {
  const {productId} = req.params;
  const product = await Product.findById(productId).exec();
  if (!product) {
      res.status(404);
      res.json({
          message: 'Product not found',
      });
  }
  Object.assign(product, req.body);
  product.updatedAt = new Date();
  await product.save();
  res.json(product);
});

/**
 * GET products/{productId} API
 * Get product by ID
 */
router.get("/products/:productId", async (req, res) => {
    const {productId} = req.params;
    Product.findById(productId).then(result => {
        if (result) {
            res.json(result);
        } else {
            res.status(404);
            res.json({
                message: 'Product not found!',
            })
        }
    });
});

/**
 * DELETE products API
 * Delete product by ID
 */
router.delete("/products/:productId", function (req, res) {
  const {productId} = req.params;
  Product.deleteOne({
    _id: productId,
  }).exec().then(result => res.json(result));
});

/**
 * POST orders API
 * Create new order
 */
router.post('orders', (req, res) => {
  const loggedInUser = req.session.user;
  if (!loggedInUser) {
    res.status(401);
    res.json({
      message: 'Unauthorized Access'
    });
    return;
  }
  Order.create({
    ...req.body,
    user: loggedInUser,
    createdAt: new Date()
  }).then(result => res.json(result));
});

/**
 * GET orders API
 * Get list order
 */
router.get('orders', async (req, res) => {
  const loggedInUser = req.session.user;
  const {skip, limit} = req.query;
  if (!loggedInUser) {
    res.status(401);
    res.json({
      message: 'Unauthorized Access'
    });
    return;
  }
  switch (loggedInUser.role) {
    case USER_ROLE: {
      const orders = await Order.find({
        'user._id': loggedInUser._id,
      }).skip(skip || 0).limit(limit || 10).exec();
      res.json(orders);
      break;
    }
    case ADMIN_ROLE: {
      Order.find().skip(skip || 0).limit(limit || 10).exec().then(orders => res.json(orders));
    }
  }
});

module.exports = router;
