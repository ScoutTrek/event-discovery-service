const { gql } = require("apollo-server");
const bcrypt = require("bcryptjs");
import { hashPassword } from "../utils/Auth";
const validator = require("email-validator");

export const typeDefs = gql`
  input LoginInput {
    email: String!
    password: String!
  }

  input SignupInput {
    name: String!
    email: String!
    password: String!
    phone: String
    birthday: String
    troopId: String
    role: ROLE
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Mutation {
    signup(input: SignupInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
  }
`;

export const resolvers = {
  Mutation: {
    signup: async (_, { input }, { mongoDbProvider, authFns }) => {
      if (!validator.validate(input.email)) {
        throw new Error("Please enter a valid email.");
      }

      const password = await hashPassword(input.password);

      const UserCreateInput = {
        ...input,
        password,
        createdAt: new Date(),
      };

      const user = await mongoDbProvider.usersCollection.insertOne(
        UserCreateInput
      );

      const token = authFns.createToken({
        id: user.ops[0]._id,
        role: user.ops[0].role,
      });

      return {
        user: user.ops[0],
        token,
      };
    },
    login: async (_, { input }, { authFns, prisma }) => {
      const user = await prisma.user({ where: { email: input.email } });

      if (!user) {
        throw new Error("Invalid login");
      }

      if (!(await bcrypt.compare(input.password, user.password))) {
        throw new Error("Invalid login");
      }

      const token = authFns.createToken(user);
      return { token, user };
    },
  },
};
