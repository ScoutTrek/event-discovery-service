"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "ROLE",
    embedded: false
  },
  {
    name: "WEEK_DAY",
    embedded: false
  },
  {
    name: "Location",
    embedded: false
  },
  {
    name: "User",
    embedded: false
  },
  {
    name: "Troop",
    embedded: false
  },
  {
    name: "Patrol",
    embedded: false
  },
  {
    name: "Event",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://34.94.55.250:4466/`,
  secret: `ottovanschnitzelpusskrakingeschitemeyer`
});
exports.prisma = new exports.Prisma();
