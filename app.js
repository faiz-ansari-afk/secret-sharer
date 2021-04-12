//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
// const md5 = require('md5')
const mongoose = require("mongoose");
// ---------------------------------------------hashing and salting using bcrypt
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// -----------------------------------------------------connect mongoDB----------------------
mongoose.connect("mongodb://localhost:27017/users", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//--------------------------------------------------- creating schema of users
const user = new mongoose.Schema({
  email: String,
  password: String,
});
//----------------------------------------------------- encrypting password field for database

// always add this plugin before mongoose model
// user.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// creating collection of users
const User = mongoose.model("User", user);
// -------------------------------------------------------Home Route------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});
//------------------------------------------------------- Register Route----------------------------------------
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const emailFromUI = req.body.username;
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      const newUser = new User({
        email: emailFromUI,
        password: hash,
      });
      newUser.save((err) => {
        if (!err) {
          console.log("saved database");
        }
      });
      res.render("secrets");
    });

    // const passwordFromUI = md5(req.body.password);
    // adding user document to users colection
  });
// --------------------------------------------------------Login route
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const emailFromUI = req.body.username;
    // const passwordFromUI = md5(req.body.password);

    User.findOne({ email: emailFromUI }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          // comparing login password from database password
          bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
            
            if (result) res.render("secrets");
            else res.send("Enter valid Credentials");
          });
        }
      }
    });
  });

app.listen("3000", (req, res) => {
  console.log("Server started at 3000");
});
