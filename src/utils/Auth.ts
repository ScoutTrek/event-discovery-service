import jwt from 'jsonwebtoken';
import jwt_decode, { JwtPayload } from "jwt-decode";
import { IUser } from 'models/User';
import type { Role } from '../../models/TroopAndPatrol'

const secret: string = "themfingsuperobvioussting"; // ??????

/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 * @param {Object} user the user to create a jwt for
 */
export const createToken = (id: number, role: Role) => { 
  return jwt.sign({ id, role }, secret, { expiresIn: "55d" }) 
};

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 * @param {String} token jwt from client
 */
export const getUserFromToken = async (token: string, db: any) => { // get rid of any type here
  try {
    const jwtUserInfo = jwt.verify(token, secret)
    
    // based on the createToken method, a jwt is created with id in its payload. However, 
    // typescript is not able to tell what the jwt will have, hence this any cast (will look into changing it):(
    const user: IUser = await db.findById((jwtUserInfo as any).id); // ok I also have no idea if this is actually an IUser but... ?????
    return user;
  } catch (e) {
    return null; 
  }
};

export const getTokenFromReq = (req: any) => {
  const authReq = req.headers.authorization;

  if (!authReq) {
    return null;
  }
  return authReq.replace("Bearer ", "");
};

// based on how/where the two functions below are being used, root, args, context, and info can be a bunch
// of different things...

/**
 * checks if the user is on the context object
 * continues to the next resolver if true
 * @param {Function} next next resolver function to run
 */
export const authenticated = (next: Function) => (root: any, args: any, context: any, info: any) => {
  if (!context?.user) {
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
export const authorized = (role: string, next: Function) => (root: any, args: any, context: any, info: any) => {
  if (context?.user?.role !== role) {
    throw new Error(
      "You are not authorized to access this route. Please request higher permissions from an administrator."
    );
  }
  return next(root, args, context, info);
};


