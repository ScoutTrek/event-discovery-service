const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  enum ROLE {
    SCOUT_MASTER
    SR_PATROL_LEADER
    PATROL_LEADER
    SCOUT
    PARENT
  }

  type User {
    id: ID!
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
    hikes: [Hike!]
    scoutMeetings: [ScoutMeeting!]
  }

  input AddUserInput {
    name: String
    email: String
    password: String
    phone: String
    birthday: String
    troop: ID
    role: ROLE
  }

  input UpdateUserInput {
    name: String
    email: String
    password: String
    phone: String
    birthday: String
    troop: ID
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
  },
  Query: {
    users: authenticated(async (_, { limit, skip }, { User }) => {
      return await User.find({}, null, { limit, skip });
    }),
    user: authenticated(async (_, { id }, { User }) => await User.findById(id)),
    currUser: authenticated(async (_, __, { user }) => user),
  },

  Mutation: {
    updateUser: authenticated(
      authorized("SCOUT_MASTER", async (_, { input, id }, { User }) => {
        if (typeof input.password === "string") {
          input.password = await User.findById(id, function(err, doc) {
            if (err) return false;
            doc.password = input.password;
            doc.save();
          });
        }
        return await User.findByIdAndUpdate(id, { ...input });
      })
    ),
    deleteUser: authenticated(
      authorized(
        "SCOUT_MASTER",
        async (_, { id }, { User }) => await User.findByIdAndDelete(id)
      )
    ),
    updateCurrUser: authenticated(
      async (_, { input }, { User, user }) =>
        await User.findByIdAndUpdate(user.id, { ...input })
    ),
    deleteCurrUser: authenticated(
      async (_, { id }, { User }) => await User.findByIdAndDelete(id)
    ),
  },
};
