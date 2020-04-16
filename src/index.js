const { ApolloServer } = require("apollo-server");

import {
  typeDefs as userTypes,
  resolvers as userResolvers,
} from "./User/User.js";
import {
  typeDefs as eventTypes,
  resolvers as eventResolvers,
} from "./Event/Event";
import {
  typeDefs as troopTypes,
  resolvers as troopResolvers,
} from "./ScoutHierarchy/TroopAndPatrol";
import { typeDefs as authTypes, resolvers as authResolvers } from "./Auth/Auth";

// import { prisma } from "../prisma/prisma-client/index";
import { mongoDbProvider, addMockUsersAsync } from "../db";
import { ObjectId } from "mongodb";
import * as authFns from "./utils/Auth";

(async () => {
  await mongoDbProvider.connectAsync(process.env.DATABASE);
  // await addMockUsersAsync(); // TODO: Remove in PROD.

  const mongoHelpers = {
    ObjectId,
  };

  const server = new ApolloServer({
    typeDefs: [userTypes, eventTypes, troopTypes, authTypes],
    resolvers: [userResolvers, eventResolvers, troopResolvers, authResolvers],
    context: async ({ req }) => {
      const user = await authFns.getUserFromToken(
        authFns.getTokenFromReq(req),
        mongoDbProvider
      );
      return {
        mongoDbProvider,
        mongoHelpers,
        req,
        authFns,
        user,
      };
    },
    introspection: true,
    playground: true,
  });

  server
    .listen({
      port: process.env.PORT || 4000,
    })
    .then(({ url }) => console.log(`Server started at ${url}`));
})();
