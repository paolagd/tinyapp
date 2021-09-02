const express = require("express");
const app = express();
const bodyParser = require("body-parser"); 
const cookieSession = require('cookie-session');
const getUserByEmail = require('./helpers').getUserByEmail; 

const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['thisismysecretkey'], 
  maxAge: 24 * 60 * 60 * 1000  
}))

//      DATABASES

// URL databases to keep track of the URLs and their shortened form
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  i3Bodr: {
    longURL: "https://www.googlasdasde.ca",
    userID: "user2RandomID"
  }
};
 

// Users DB
const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "pacri14@gmail.com",
    password: "$2a$10$9jP.NH8H.cmHyK/rf7hAL.ssljfamPHq9r1wR7tSpilcFASXnKDGy"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$9jP.NH8H.cmHyK/rf7hAL.ssljfamPHq9r1wR7tSpilcFASXnKDGy"
  }
}

//    HELPER FUNCTIONS

const generateRandomString = function () {
  return Math.random().toString(36).substr(2, 6);
}
  
//Returns the URLS created by a specific user
const urlsForUser = function (urlDB, userID) {
  let userURLs = {};

  for (const url in urlDB) {
    if (urlDB[url].userID === userID) {
      userURLs[url] = urlDB[url]
    }
  }
  return userURLs;
}

// Review if the user's password is the same as the password provided
const authenticateUser = function (userDB, email, password) {
  const user = getUserByEmail(userDB, email); 
  const hashedPassword = user.password;
  if (user && bcrypt.compareSync(password, hashedPassword)) {
    return user;
  }
  return false;
}

//Hashes password
const hashPassword = function(password){
  let salt = bcrypt.genSaltSync(10); 
  const hashedPassword = bcrypt.hashSync(password, salt); 
  return hashedPassword;
} 

//       ROUTES

/// URL Routes

//Lists all the URLs
app.get("/urls", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  const urls = urlsForUser(urlDatabase, req.session.user_id);

  const templateVars = {
    urls,
    user
  };
  res.render('urls_index', templateVars);
});

//Renders page to create new URL
app.get("/urls/new", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  if (!user) {
    return res.redirect(`/urls`);
  }
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

//Search for url by ShortURL (key)
app.get("/urls/:shortURL", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

//Create new URL record and saves it in the DB
app.post("/urls", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  if (!user) {
    return res.redirect(`/urls`);
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = user.id;
  urlDatabase[shortURL] = {
    longURL,
    userID
  };

  console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`);

});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  const shortURL = req.params.shortURL;

  if (!user || urlDatabase[shortURL].userID !== user.id) {
    res.statusCode = 401;
    return res.send({ error: 'Unauthorized action' });
  }

  delete urlDatabase[shortURL];
  res.redirect(`/urls`);

});

//Update URL
app.post("/urls/:shortURL", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
 
  if (!user || urlDatabase[shortURL].userID !== user.id) {
    res.statusCode = 401;
    return res.send({ error: 'Unauthorized action' });
  }

  //If the new URL is empty then the old one is not modified
  if (longURL) { 
    urlDatabase[shortURL].longURL = longURL;
  } 
  res.redirect(`/urls`);

});

/// Redirect URLs 
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.status(404).send({ error: 'Short URL not found!' });
  }
  res.redirect(url.longURL);
});

/// User Routes

//LOGIN page render
app.get("/login", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  if (user) {
    return res.redirect(`/urls`);
  }
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

  console.log(usersDatabase)
  if (authenticatedUser) {
    req.session.user_id = authenticatedUser.id;
    res.redirect(`/urls`);
  } else {
    res.statusCode = 403;
    res.send({ error: 'Invalid credentials.' });
  }
});

//LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

//REGISTER page render
app.get("/register", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  if (user) {
    return res.redirect(`/urls`);
  }
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

  const userExists = getUserByEmail(usersDatabase, email);

  if (userExists) {
    res.statusCode = 400;
    return res.send({ error: 'Invalid credentials.' });
  }

  const user_id = generateRandomString();  
  const hashedPassword = hashPassword(password); 

  const newUser = {
    id: user_id,
    email,
    password: hashedPassword
  }

  console.log(usersDatabase)
  usersDatabase[user_id] = newUser; 
  req.session.user_id = user_id;
  res.redirect(`/urls`);
});


app.get("/", (req, res) => {
  res.redirect(`/urls`);
});

 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
