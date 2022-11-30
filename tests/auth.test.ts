// Models
import { ApolloServer, ExpressContext, gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import { buildSchemaSync } from 'type-graphql';

import { EventModel, TroopModel, UserModel } from '../models/models';
import { TypegooseMiddleware } from '../src/middleware/typegoose_middlware';
import { AuthResolver } from '../src/resolvers/auth';
import { PatrolResolver } from '../src/resolvers/patrol';
import { TroopResolver } from '../src/resolvers/troop';
import { UserResolver } from '../src/resolvers/user';
import * as authFns from '../src/utils/Auth';

import type { ContextType } from "../src/server";
import { setupDB } from './test_setup';

setupDB('scouttrek-test');

const schema = buildSchemaSync({
  resolvers: [AuthResolver, UserResolver, TroopResolver, PatrolResolver],
  globalMiddlewares: [TypegooseMiddleware],
  authChecker: authFns.customAuthChecker,
});

// Create GraphQL server
const server = new ApolloServer({
  schema,
  context: async ({ req }) => {
    let ret: ContextType = {
      UserModel,
      EventModel,
      TroopModel,
      req,
      authFns
    };

    const token = authFns.getTokenFromReq(req);
    if (!token) {
      return ret;
    }
    const user = await authFns.getUserFromToken(token);

    // Update this for membership paradigm --(connie: not sure what this means but will leave the comment here )
    const membership = Array.isArray(req.headers?.membership) ? req.headers?.membership[0] : req.headers?.membership; // this is really bad... 

    const membershipIDString = membership === "undefined" ? undefined : new mongoose.Types.ObjectId(membership).toString();

    if (membershipIDString) {
      ret.membershipIDString = membershipIDString;
      ret.user = user;
      const currMembership = user.groups.find((membership) => {
        return membership._id.equals(membershipIDString);
      });
      if (currMembership) {
        // ret.tokens = await getUserNotificationData(currMembership.troopID._id.toString());
        ret.currMembership = currMembership;
      }
    }

    return ret;
  },
});

test("Creates a new user", async () => {
  const createUser = gql`
    mutation {
      signup(
        input: {
          name: "Elise Chavenport"
          email: "elisemeChavenport@gmail.com"
          password: "password"
          passwordConfirm: "password"
          phone: "8658061326"
          birthday: "2000-12-12"
        }
      ) {
        user {
          id
          name
        }
        token
      }
    }
  `;
  const response = await server.executeOperation({
    query: createUser,
  });

  const count = await UserModel.count({ _id: response.data?.signup.user.id });
  expect(count).toBe(1);
});
