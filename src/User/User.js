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

  input UserInput {
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
    updateUser(input: UserInput!, id: ID!): User
    deleteUser(id: ID!): User
    updateCurrUser(input: UserInput!): User
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
    user: authenticated(
      async (_, { id }, { mongoDbProvider, mongoHelpers }) =>
        await mongoDbProvider.usersCollection.findOne({
          _id: mongoHelpers.ObjectId(id),
        })
    ),
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
        "ADMIN",
        async (_, { id }, { prisma }) =>
          await prisma.mutation.deleteUser({ where: { id } })
      )
    ),
    updateCurrUser: authenticated(
      async (_, { input }, { user, prisma }) =>
        await prisma.mutation.updateUser({
          where: { id: user.id },
          data: { ...input },
        })
    ),
    deleteCurrUser: authenticated(
      async (_, { id }, { prisma }) =>
        await prisma.query.user({ where: { id } })
    ),
  },
};
