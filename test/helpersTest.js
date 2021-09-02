const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "user@example.com"); 
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput);
  });

  it('should return undefined if an email address that does not exist is passed to the function', function() {
    const user = getUserByEmail(testUsers, "user3@example.com"); 
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });

  it('should return undefined if no email es passed', function() {
    const user = getUserByEmail(testUsers); 
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});
