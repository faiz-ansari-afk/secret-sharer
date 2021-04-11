//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// -----------------------------------------------------connect mongoDB----------------------
mongoose.connect("mongodb://localhost:27017/users", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// creating schema of users
const user = new mongoose.Schema({
  email:String,
  password:String
});
//----------------------------------------------------- encrypting password field for database
const secret = "Thisisourlittlesecret";
// always add this plugin before mongoose model
user.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
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
    const passwordFromUI = req.body.password;
    // adding user document to users colection
    const newUser = new User({
      email: emailFromUI,
      password: passwordFromUI,
    });
    newUser.save((err) => {
      if (!err) {
        console.log("saved database");
      }
    });
    res.render("secrets");
  });
// --------------------------------------------------------Login route
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const emailFromUI = req.body.username;
    const passwordFromUI = req.body.password;
    User.findOne({ email: emailFromUI }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          if (foundUser.password === passwordFromUI) res.render("secrets");
          else res.send("Enter valid Credentials");
        }
      }
    });
  });

app.listen("3000", (req, res) => {
  console.log("Server started at 3000");
});
