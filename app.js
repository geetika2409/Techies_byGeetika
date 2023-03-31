//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/blog", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const homeContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const aboutContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const contactContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const postSchema = {
    title: String,
    content: String,
    img: {
        data: Buffer,
        contentType: String
    },
    email: String
};

const Post = mongoose.model("Post", postSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, "uploads")
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
  }
});

const upload = multer({storage: storage});

app.get("/", function(req, res){
    res.render("loginInitial");
}); 

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err){ 
      console.log(err); 
    }
    res.redirect("/");
  });
});

app.post("/register", function(req, res){ 
  User.register({username: req.body.username}, req.body.password,  function(err, user){
      if(err){
          console.log(err);
          res.redirect("/register");
      }
      else{
          passport.authenticate("local")(req, res, function(){
              res.redirect("/home");
          });
      }
  });
});

app.post("/login", function(req, res){
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });
  req.login(user, function(err){
      if(err){
        console.log(err);
        res.redirect("/login")
      }
      else{
          passport.authenticate("local",{failureRedirect: "/login"})(req, res, function(){
              res.redirect("/home");
          });
      }
  });
});

app.get("/home", function(req, res){
  if(req.isAuthenticated()){
    Post.find({})
    .then((posts) => {
      res.render("home", {
        startingVar: homeContent,
        posts: posts
      });
    });
  }
  else
    res.redirect("/"); 
});


app.get("/posts/:postId",function(req,res){
  if(req.isAuthenticated()){
    const requestedPostId = req.params.postId;
    Post.findOne({_id: requestedPostId})
    .then((post) => {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    });
  }
  else
    res.redirect("/");
});

app.get("/about", function(req, res){
  if(req.isAuthenticated()){
    res.render("about", {aboutU: aboutContent});
  }
  else
    res.redirect("/");
});
  
app.get("/contact", function(req, res){
  if(req.isAuthenticated()){
    res.render("contact", {contactUs: contactContent});
  }
  else
    res.redirect("/");
});

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("compose");
  }
  else
    res.redirect("/");
});

app.post("/compose",upload.single('image'), function(req, res,next){
  const post = {
    title: req.body.postTitle,
    content: req.body.postBody,
    img:{
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
          contentType: 'image/png'
    },  
    email: req.user.username
  };

  Post.create(post)
    .then((err) => {
       if(err)
        res.redirect("/home");
      else 
        console.log(err);
    })
});

app.get("/profile", function(req, res){
  if(req.isAuthenticated()){
    Post.find({email: req.user.username})
    .then((posts) => {
      res.render("profile.ejs", {posts: posts});
    });
  }
  else
    res.redirect("/");
});

app.post("/delete", function(req, res){
  const toDelete = req.body.del;
  Post.findByIdAndRemove(toDelete)
  .then((err) => {
    if(err)
     res.redirect("/profile");
   else 
     console.log(err);
 })
});

app.listen(3000, function(){
  console.log("Server started on port 3000");
});