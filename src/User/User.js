const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  enum ROLE {
    SCOUTMASTER
    SENIOR_PATROL_LEADER
    PATROL_LEADER
    SCOUT
    PARENT
  }

  type User {
    id: ID!
    expoNotificationToken: String!
    createdAt: String
    updatedAt: String
    name: String!
    email: String!
    phone: String
    birthday: String
    age: Int
    troop: Troop!
    patrol: Patrol!
    role: ROLE!
    events: Event
  }

  input AddUserInput {
    name: String!
    email: String!
    expoNotificationToken: String
    password: String!
    phone: String
    birthday: String
    troop: ID!
    patrol: ID
    role: ROLE!
  }

  input UpdateUserInput {
    name: String
    email: String
    expoNotificationToken: String
    password: String
    phone: String
    birthday: String
    troop: ID
    patrol: ID
    role: ROLE
  }

  type Query {
    users(limit: Int, skip: Int): [User]
    user(id: ID!): User
    currUser: User!
  }

  type Mutation {
    updateUser(input: UpdateUserInput!, id: ID!): User
    deleteUser(id: ID!): User
    updateCurrUser(input: UpdateUserInput!): User
    deleteCurrUser: User
  }
`;

export const resolvers = {
  User: {
    id: (parent) => {
      return parent._id;
    },
    troop: async (parent, __, { Troop }) => await Troop.findById(parent.troop),
    patrol: async (parent, __, { Troop }) => {
      const myTroop = await Troop.findById(parent.troop);
      const myPatrol = await myTroop.patrols.id(parent.patrol);
      return myPatrol;
    },
  },
  Query: {
    user: authenticated(async (_, { id }, { User }) => await User.findById(id)),
    users: authenticated(async (_, { limit, skip }, { User }) => {
      return await User.find({}, null, { limit, skip });
    }),
    currUser: authenticated(async (_, __, { user }) => user),
  },

  Mutation: {
    updateUser: authenticated(
      authorized("SCOUTMASTER", async (_, { input, id }, { User }) => {
        if (typeof input.password === "string") {
          input.password = await User.findById(id, function (err, doc) {
            if (err) return false;
            doc.password = input.password;
            doc.save();
          });
        }
        return await User.findByIdAndUpdate(id, { ...input }, { new: true });
      })
    ),
    deleteUser: authenticated(
      authorized(
        "SCOUTMASTER",
        async (_, { id }, { User }) => await User.findByIdAndDelete(id)
      )
    ),
    updateCurrUser: authenticated(
      async (_, { input }, { User, user }) =>
        await User.findByIdAndUpdate(user.id, { ...input }, { new: true })
    ),
    deleteCurrUser: authenticated(
      async (_, { id }, { User }) => await User.findByIdAndDelete(id)
    ),
  },
};
