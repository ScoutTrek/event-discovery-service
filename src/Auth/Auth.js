const { gql } = require("apollo-server");
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
    troopNum: String
    patrol: ID!
    role: ROLE!
    children: [String]
  }

  type AuthPayload {
    token: String!
    user: User!
    groupID: ID!
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

      const troop = await Troop.findById(input?.troop);

      const userInput = {
        name: input.name,
        email: input.email,
        expoNotificationToken: input.expoNotificationToken,
        password: input.password,
        passwordConfirm: input.passwordConfirm,
        groups: [
          {
            troop: input.troop,
            troopNum: troop?.unitNumber,
            patrol: input?.patrol,
            role: input.role,
          },
        ],
        children: input.children,
      };

      const user = await User.create({ ...userInput });

      if (input.patrol) {
        const patrol = await troop.patrols.id(input.patrol);
        patrol.members.push(user.id);
      }

      await troop.save();

      if (input.role === "SCOUTMASTER" || input.role === "Scoutmaster") {
        await Troop.findByIdAndUpdate(input.troop, {
          scoutMaster: user?.groups?._id,
        });
      }

      const token = authFns.createToken({ id: user._id, role: user.role });

      return {
        user,
        token,
        groupID: user?.groups[0]?._id,
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

      if (input.expoNotificationToken) {
        if (input.expoNotificationToken !== user.expoNotificationToken) {
          await User.findByIdAndUpdate(user.id, {
            expoNotificationToken: input.expoNotificationToken,
          });
        }
      }

      const token = authFns.createToken(user);
      return { token, user, groupID: user?.groups[0]?._id };
    },
  },
};
