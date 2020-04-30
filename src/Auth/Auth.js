const { gql } = require("apollo-server");
const bcrypt = require("bcryptjs");
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
    signup: async (_, { input }, { User, authFns }) => {
      if (!validator.validate(input.email)) {
        throw new Error("Please enter a valid email.");
      }

      const UserCreateInput = {
        ...input,
      };

      const user = await User.create(UserCreateInput);

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

      const token = authFns.createToken(user);
      return { token, user };
    },
  },
};
