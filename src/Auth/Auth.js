const { gql } = require("apollo-server");
const bcrypt = require("bcryptjs");
const validator = require("email-validator");

export const typeDefs = gql`
  input LoginInput {
    email: String!
    password: String!
    expoNotificationToken: String
  }

  input SignupInput {
    name: String!
    email: String!
    expoNotificationToken: String
    password: String!
    passwordConfirm: String!
    phone: String
    birthday: String
    troop: ID!
    patrol: ID!
    role: ROLE!
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
    signup: async (_, { input }, { User, Troop, authFns }) => {
      if (!validator.validate(input.email)) {
        throw new Error("Please enter a valid email.");
      }

      const user = await User.create({ ...input });

      if (input.role === "SCOUTMASTER" || input.role === "Scoutmaster") {
        await Troop.findByIdAndUpdate(input.troop, {
          scoutMaster: user.id,
        });
      }

      const token = authFns.createToken({ id: user._id, role: user.role });

      return {
        user,
        token,
      };
    },
    login: async (_, { input }, { authFns, User }) => {
      const { email, password } = input;

      if (!email || !password) {
        throw new Error("Please provide an email and password.");
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user || !(await user.isValidPassword(password, user.password))) {
        throw new Error("Invalid login");
      }

      console.log(user.id);
      console.log(input.expoNotificationToken, user.expoNotificationToken);
      if (input.expoNotificationToken !== user.expoNotificationToken) {
        await User.findByIdAndUpdate(user.id, {
          expoNotificationToken: input.expoNotificationToken,
        });
      }

      const token = authFns.createToken(user);
      return { token, user };
    },
  },
};
