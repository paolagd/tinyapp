const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(cookieParser());

//      DATABASES

// URL databases to keep track of the URLs and their shortened form
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Users DB
const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//    MISC FUNCTIONS

const generateRandomString = function () {
  return Math.random().toString(36).substr(2, 6);
}

const findUserByEmail = function (usersDB, email) {
  //Search in the users db for: 
  return usersDB[Object.keys(usersDB).find(element => email === usersDB[element].email)];
}

// Review if the user's password is the same as the password provided
const authenticateUser = function(userDB, email, password){
  const user = findUserByEmail(userDB, email); 
  if (user && user.password === password) { 
    return user; 
  }
  return false;
}
 

//       ROUTES

/// URL Routes

//Lists all the URLs
app.get("/urls", (req, res) => {
  const user = usersDatabase[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render('urls_index', templateVars);
});

//Renders page to create new URL
app.get("/urls/new", (req, res) => {
  const user = usersDatabase[req.cookies["user_id"]];
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

//Search for url by ShortURL (key)
app.get("/urls/:shortURL", (req, res) => {
  const user = usersDatabase[req.cookies["user_id"]];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.render("urls_show", templateVars);
});

//Create new URL record and saves it in the DB
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);

});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);

});

//Update URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);

});

/// Redirect URLs 
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404).send({ error: 'Short URL not found!' });
  }
  res.redirect(longURL);
});

/// User Routes

//LOGIN page render
app.get("/login", (req, res) => {
  const user = usersDatabase[req.cookies["user_id"]];
  const templateVars = {
    user
  };
  res.render("login", templateVars);
});

//LOGIN
app.post("/login", (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    res.statusCode = 400;
    return res.send({ error: 'Please provide email and password.' });
  }

  const authenticatedUser = authenticateUser(usersDatabase, email, password);
  
  if (authenticatedUser) {
      res.cookie('user_id', authenticatedUser.id);
      res.redirect(`/urls`);
  }else{ 
    res.statusCode = 403;
    res.send({ error: 'Invalid credentials.' });
  }
});

//LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

//REGISTER page render
app.get("/register", (req, res) => {
  const user = usersDatabase[req.cookies["user_id"]];
  const templateVars = {
    user
  };
  res.render("register", templateVars);
});

//Register a new user
app.post("/register", (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    res.statusCode = 400;
    return res.send({ error: 'Please provide email and password.' });
  }

  const userExists = findUserByEmail(usersDatabase, email);

  if (userExists) {
    res.statusCode = 400;
    return res.send({ error: 'Invalid credentials.' });
  }

  const user_id = generateRandomString();

  const newUser = {
    id: user_id,
    email,
    password
  }

  usersDatabase[user_id] = newUser;
  res.cookie('user_id', user_id);
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
