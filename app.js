//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
// const md5 = require('md5')
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const  GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


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
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  username: String,
  secret: String
});
// -----------------------connect passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//----------------------------------------------------- encrypting password field for database

// always add this plugin before mongoose model
// user.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// creating collection of users
const User = new mongoose.model("User", userSchema);

// --------serialize and deserialize after mongoose model
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// this only works for local authentication
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// --------------------------------Google Authentication-----------------------
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
// accessToken allowed us to access user data for longer period of time
function(accessToken, refreshToken, profile, cb) {
  // User.findOrCreate({ username: profile.emails[0].value ,googleId: profile.id }, function (err, user) {
  //   console.log(profile)
  //   return cb(err, user);
  // });
  User.findOne( {username:profile.displayName, googleId : profile.id}, function( err, foundUser ){
    if( !err ){                                                          //Check for any errors
        if( foundUser ){                                          // Check for if we found any users
            return cb( null, foundUser );                  //Will return the foundUser
        }
        else {      
                                              //Create a new User
            const newUser = new User({
                googleId : profile.id,
                username : profile.displayName
            });
            newUser.save( function( err ){
                if(!err){
                    return cb(null, newUser);                //return newUser
                }
            });
        }
    }else{
        console.log( err );
    }
});
}
));
// -------------------------------------------------------Home Route------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});
// ----------------------------auth/google Route----------------------
app.route("/auth/google").get(
  passport.authenticate('google', { scope:["profile","email"] })
)

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
// ------------------------------------------------------Secrets Route----------------------
app
  .route("/secrets")
  .get((req,res)=>{
    if (req.isAuthenticated()){
      User.find({"secret":{$ne:null}}, (err,foundUser)=>{
        if(err)
        console.log(err)
        else{
          if(foundUser){
            res.render("secrets",{userWithSecret:foundUser})
          }
        }
      })
    }else{
      res.redirect("/login")
    }
   
  });
  // ----------------------------------------------------------submit route-------------------------
  app.route("/submit").get( (req,res)=>{
    if (req.isAuthenticated()){
      res.render("submit")
    }else{
      res.redirect("/login")
    }
  }).post((req,res)=>{
    const submittedSecret = req.body.secret;
    // console.log(req)
    // console.log(req.user.id)
    User.findById(req.user.id, (err,foundUser)=>{
      if(err)
      console.log(err)
      else{
        if(foundUser){
          foundUser.secret = submittedSecret;
          foundUser.save(err=>{
            if(err){
              console.log("Err while adding particular secret")
            }
            else{
              res.redirect("/secrets");
            }
          })
        }
      }
    })
  })
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
