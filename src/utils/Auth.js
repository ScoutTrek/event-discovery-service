const jwt = require("jsonwebtoken");
const secret = "themfingsuperobvioussting";
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 * @param {Object} user the user to create a jwt for
 */
const createToken = ({ id, role }) =>
  jwt.sign({ id, role }, secret, { expiresIn: "55d" });

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 * @param {String} token jwt from client
 */
const getUserFromToken = async (token, db) => {
  try {
    const jwtUserInfo = jwt.verify(token, secret);
    const user = await db.usersCollection.findOne({
      _id: ObjectId(jwtUserInfo.id),
    });
    return user;
  } catch (e) {
    return null;
  }
};

const getTokenFromReq = (req) => {
  const authReq = req.headers.authorization;

  if (!authReq) {
    return null;
  }
  return authReq.replace("Bearer ", "");
};

const hashPassword = (password) => {
  if (password.length < 8) {
    throw new Error("Password must be 8 characters or longer!");
  }
  return bcrypt.hash(password, 10);
};

/**
 * checks if the user is on the context object
 * continues to the next resolver if true
 * @param {Function} next next resolver function to run
 */
const authenticated = (next) => (root, args, context, info) => {
  if (!context.user) {
    throw new Error("You must be logged in to complete this action.");
  }
  return next(root, args, context, info);
};

/**
 * checks if the user on the context has the specified role.
 * continues to the next resolver if true
 * @param {String} role enum role to check for
 * @param {Function} next next resolver function to run
 */
const authorized = (role, next) => (root, args, context, info) => {
  if (context.user.role !== role) {
    throw new Error(
      "You are not authorized to access this route. Please request higher permissions from an administrator."
    );
  }
  return next(root, args, context, info);
};

module.exports = {
  getUserFromToken,
  getTokenFromReq,
  hashPassword,
  authenticated,
  authorized,
  createToken,
};
