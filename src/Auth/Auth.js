const { gql } = require("apollo-server-express");
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
    password: String!
    passwordConfirm: String!
    expoNotificationToken: String
    phone: String
    birthday: String
  }

  type SignupPayload {
    token: String!
    user: User!
    noGroups: Boolean!
  }

  type LoginPayload {
    token: String!
    user: User!
    groupID: ID!
    noGroups: Boolean!
  }

  extend type Mutation {
    signup(input: SignupInput!): SignupPayload!
    login(input: LoginInput!): LoginPayload!
  }
`;

export const resolvers = {
  Mutation: {
    signup: async (_, { input }, { UserModel, authFns }) => {
      if (!validator.validate(input.email)) {
        throw new Error("Please enter a valid email.");
      }

      const userInput = {
        name: input.name,
        email: input.email,
        expoNotificationToken: input.expoNotificationToken,
        password: input.password,
        passwordConfirm: input.passwordConfirm,
      };

      const user = await UserModel.create({ ...userInput });

      const token = authFns.createToken({ id: user._id, role: user.role });

      return {
        user,
        token,
        noGroups: true,
      };
    },
    login: async (_, { input }, { authFns, UserModel }) => {
      const { email, password } = input;

      if (!email || !password) {
        throw new Error("Please provide an email and password.");
      }

      const user = await UserModel.findOne({ email }).select("+password");

      if (!user || !(await user.isValidPassword(password, user.password))) {
        throw new Error("Invalid login");
      }

      if (input.expoNotificationToken) {
        if (input.expoNotificationToken !== user.expoNotificationToken) {
          await UserModel.findByIdAndUpdate(user.id, {
            expoNotificationToken: input.expoNotificationToken,
          });
        }
      }

      const token = authFns.createToken(user);
      return {
        token,
        user,
        noGroups: !user.groups.length,
        groupID: user?.groups[0]?._id,
      };
    },
  },
};
