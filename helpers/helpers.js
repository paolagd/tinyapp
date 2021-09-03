const bcrypt = require('bcryptjs');


//Returns user object found with the email provided
const getUserByEmail = function (usersDB, email) {
  //Search in the users db for: user that has de same email as provided  
  return usersDB[Object.keys(usersDB).find(element => email === usersDB[element].email)];
}

//Generates random string - length 6
const generateRandomString = function () {
  return Math.random().toString(36).substr(2, 6);
}

//Returns the URLS created by a specific user
const getUrlsByUser = function (urlDB, userID) {
  let userURLs = {};

  for (const url in urlDB) {
    if (urlDB[url].userID === userID) {
      userURLs[url] = urlDB[url];
    }
  }
  return userURLs;
}

 
// Review if the user's password is the same as the password provided
const authenticateUser = function (userDB, email, password) {
  const user = getUserByEmail(userDB, email);

  if (!user) {
    return false;
  }

  const hashedPassword = user.password;

  if (bcrypt.compareSync(password, hashedPassword)) {
    return user;
  }
  return false;
}

//Hashes password
const hashPassword = function (password) {
  let salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
}

module.exports = {
  getUserByEmail,
  generateRandomString,
  getUrlsByUser,
  authenticateUser,
  hashPassword
}