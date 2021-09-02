const getUserByEmail = function (usersDB, email) {
  //Search in the users db for: user that has de same email as provided  
  return usersDB[Object.keys(usersDB).find(element => email === usersDB[element].email)];
}

module.exports = {
  getUserByEmail
}