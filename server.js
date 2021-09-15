const express = require("express");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const config = require("./config");
const mongoose = require("mongoose");
const router = require("./controller");
const cors = require("cors");
const app = express();

// middleware to allow CORS
app.use(cors());

// middleware for static files
app.use('/public', express.static('public'));

// middleware to parse the request body as JSON
app.use(express.json());

// middleware to store session in MongoDB
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: config.secret,
    cookie: {
      maxAge: 3600000,
    },
    store: MongoStore.create({
      mongoUrl: config.mongoUrl,
      secret: config.secret,
      collectionName: "sessions",
    }),
  })
);

app.use(router);

mongoose.connect(config.mongoUrl)
.then(() => {
  app.listen(config.port, () => {
    console.log(`WIC app listening at http://localhost:${config.port}`);
  });
})
.catch(err => console.log('Connect to database failed', err));
