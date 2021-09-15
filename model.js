const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Product = new Schema({
  name: { type: String, default: "", trim: true, maxlength: 200 },
  image: { type: String, default: "", trim: true },
  price: Number,
  category: [
    {
      id: ObjectId,
      name: String,
    },
  ],
  status: String,
  sizes: [String],
  brand: String,
  isNew: Boolean,
  techniques: [String],
  quantity: Number,
  createdAt: Date,
  updatedAt: Date,
});

const Category = new Schema({
  name: String,
  parent: String,
});

const User = new Schema({
  name: String,
  username: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date,
});

const Order = new Schema({
  products: [
    {
      id: ObjectId,
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  user: {
    _id: ObjectId,
    name: String,
    username: String,
    role: String,
  },
  createdAt: Date,
});

module.exports = {
  Product: mongoose.model('Product', Product),
  Category: mongoose.model('Category', Category),
  User: mongoose.model('User', User),
  Order: mongoose.model('Order', Order),
}
