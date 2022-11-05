import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import { ObjectId } from "mongodb/mongodb";
import { User, UserModel } from "models/User";

const SECRET = "themfingsuperobvioussting";
const DEFAULT_EXPIRES_IN = "55d";


/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 * @param {Object} user the user to create a jwt for
 */
export function createToken(
  { id, role }: { id: string; role: string; }
): string {
  return jwt.sign({ id, role }, SECRET, { expiresIn: DEFAULT_EXPIRES_IN });
}

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 * @param {String} token jwt from client
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    // const jwtUserInfo = jwt.verify(token, secret);
    const jwtUserInfo = jwtDecode(token) as unknown & { id: string };
    const user = await UserModel.findById(jwtUserInfo.id);
    return user;
  } catch (e) {
    return null;
  }
};

/**
 * TODO
 * @param req
 */
export function getTokenFromReq(req: any): string | null {
  const authReq = req.headers.authorization;

  if (!authReq) {
    return null;
  }

  return authReq.replace("Bearer ", "");
};
/**
 * checks if the user is on the context object
 * continues to the next resolver if true
 * @param {Function} next next resolver function to run
 */
export function authenticated(next: Function) {
  return (root: any, args: any, context: any, info: any) => {
    if (!context.user) {
      throw new Error("You must be logged in to complete this action.");
    }
    return next(root, args, context, info);
  }
};

/**
 * checks if the user on the context has the specified role.
 * continues to the next resolver if true
 * @param {String} role enum role to check for
 * @param {Function} next next resolver function to run
 */
export function authorized(role: string, next: Function) {
  return (root: any, args: any, context: any, info: any) => {
    if (context.user.role !== role) {
      throw new Error(
        "You are not authorized to access this route. Please request higher permissions from an administrator."
      );
    }
    return next(root, args, context, info);
  }
};

// module.exports = {
//   getUserFromToken,
//   getTokenFromReq,
//   authenticated,
//   authorized,
//   createToken,
// };
