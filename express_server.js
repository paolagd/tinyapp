const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, getUrlsByUser, authenticateUser, hashPassword } = require('./helpers/helpers');

const PORT = 8080; 

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
 
//       ROUTES

/// URL Routes

//Lists all the URLs
app.get("/urls", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  const urls = getUrlsByUser(urlDatabase, req.session.user_id);

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
  const urlRecord = urlDatabase[req.params.shortURL]; 

  if (!user || urlRecord.userID !== user.id) {
    res.statusCode = 401;
    return res.send({ error: 'Unauthorized action' });
  }

  if (!urlRecord) {
    return res.status(404).send({ error: 'URL not found' });
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlRecord.longURL,
    user
  };

  res.render("urls_show", templateVars);
});

//Create new URL record and saves it in the DB
app.post("/urls", (req, res) => {
  const user = usersDatabase[req.session.user_id];

  if (!user) {
    res.statusCode = 401;
    return res.send({ error: 'Unauthorized action' });
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = user.id;
  urlDatabase[shortURL] = {
    longURL,
    userID
  };

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

  //Changes are saved only if the longURL is not falsy(empty)
  if (longURL) {
    urlDatabase[shortURL].longURL = longURL;
  }
  res.redirect(`/urls`);

});

/// Redirect URLs 
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];

  if (!url) {
    res.status(404).send({ error: 'URL not found!' });
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

  //used by the header
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

  //used by the header
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

  //Generating a new ID and hashing the provided password
  const user_id = generateRandomString();
  const hashedPassword = hashPassword(password);

  const newUser = {
    id: user_id,
    email,
    password: hashedPassword
  }

  //creating new user
  usersDatabase[user_id] = newUser; 
  req.session.user_id = user_id;
  res.redirect(`/urls`);
});


app.get("/", (req, res) => {
  const user = usersDatabase[req.session.user_id];

  if (user) {
    return res.redirect(`/urls`);
  }
  return res.redirect(`/login`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
