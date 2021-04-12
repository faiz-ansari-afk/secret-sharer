//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
// const md5 = require('md5')
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// ---------------------------------------------hashing and salting using bcrypt

// const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// ------------use session before MONGOdb connection
app.use(session({
  secret:"Our Little Secret.",
  resave:false,
  saveUninitialized:false,
}));
app.use(passport.initialize());
app.use(passport.session())
// -----------------------------------------------------connect mongoDB----------------------
mongoose.connect("mongodb://localhost:27017/users", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex",true)
//--------------------------------------------------- creating schema of users
const user = new mongoose.Schema({
  email: String,
  password: String,
});
// -----------------------connect passport-local-mongoose
user.plugin(passportLocalMongoose)
//----------------------------------------------------- encrypting password field for database

// always add this plugin before mongoose model
// user.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// creating collection of users
const User = new mongoose.model("User", user);

// --------serialize and deserialize after mongoose model
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// -------------------------------------------------------Home Route------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});
// ------------------------------------------------------Secrets Route----------------------
app
  .route("/secrets")
  .get((req,res)=>{
    if (req.isAuthenticated()){
      res.render("secrets")
    }else{
      res.redirect("/login")
    }
  });
//------------------------------------------------------- Register Route----------------------------------------
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register({username:req.body.username},req.body.password,(err,user)=>{
      if(err){
        console.log(err)
        res.redirect("/register")
      }
      else{
        passport.authenticate("local")(req,res,()=>{
          res.redirect("/secrets")
        })
      }
      
      
    })

    
  });
// --------------------------------------------------------Login route
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
   const user = new User({
     username: req.body.username,
     password: req.body.password
   });
  //  login() is inbuilt function of passport
   req.login(user , (err)=>{
     if(err)
     console.log(err)
     else{
       passport.authenticate("local")(req,res,()=>{
         res.redirect("/secrets")
       })
     }
   })
  });
  // -------------------------------------Logout route----------------
  app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/")
  })

app.listen("3000", (req, res) => {
  console.log("Server started at 3000");
});
