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

import * as authFns from "./utils/Auth";
import mongoose from "mongoose";
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});

const mongo = mongoose.connection;
mongo.on("error", console.error.bind(console, "connection error:"));
mongo.once("open", function () {
  console.log("Database connected!");
});

const server = new ApolloServer({
  typeDefs: [userTypes, eventTypes, troopTypes, authTypes],
  resolvers: [userResolvers, eventResolvers, troopResolvers, authResolvers],
  context: async ({ req }) => {
    const user = await authFns.getUserFromToken(
      authFns.getTokenFromReq(req),
      User
    );
    return {
      User,
      Event,
      Troop,
      req,
      authFns,
      user,
    };
  },
  introspection: true,
  playground: true,
});

export default server;
