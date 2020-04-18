const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  type Troop {
    id: ID!
    council: String!
    state: String!
    unitNumber: Int
    patrols: [Patrol]
    events: [Event!]
  }

  input AddTroopInput {
    council: String!
    state: String!
    unitNumber: Int
    patrols: [ID]
    events: [ID]
  }

  input UpdateTroopInput {
    council: String
    state: String
    unitNumber: Int
    patrols: [ID]
    events: [ID]
  }

  type Patrol {
    id: ID!
    troop: Troop!
    name: String!
    members: [User!]!
    events: [Event!]
  }

  input AddPatrolInput {
    name: String!
    members: [ID!]
    events: [ID!]
  }

  input UpdatePatrolInput {
    name: String
    members: [ID!]
    events: [ID!]
  }

  extend type Query {
    patrols: [Patrol]
    patrol(id: ID!): Patrol!
    currPatrol: Patrol!
  }

  extend type Mutation {
    addTroop(input: AddTroopInput): Troop
    updateTroop(id: ID!, input: UpdateTroopInput): Troop
    updateCurrTroop(input: UpdateTroopInput): Troop
    deleteTroop(id: ID!): Troop
    deleteCurrTroop: Troop
    addPatrol(troopId: ID!, input: AddPatrolInput): Patrol
    updatePatrol: Patrol
    updateCurrPatrol: Patrol
    deletePatrol: Patrol
    deleteCurrPatrol: Patrol
  }
`;

export const resolvers = {
  Query: {
    patrols: async (_, __, { Troop, user }) => {
      const myTroop = await Troop.findById(user.troop);
      return myTroop.patrols;
    },
    patrol: async (_, { id }, { prisma }) =>
      await prisma.query.patrol({ where: { id } }),
    currPatrol: authenticated(
      async (_, __, { user }) =>
        await prisma.query.patrols({ where: { members_some: { id: user.id } } })
    ),
  },

  Mutation: {
    addTroop: authenticated(async (_, { input }, { Troop }) =>
      Troop.create(input)
    ),
    addPatrol: authenticated(async (_, { troopId, input }, { Troop }) => {
      const troop = await Troop.findById(troopId);
      troop.patrols.push(input);

      troop.save(function(err) {
        if (err) return new Error(err);
      });

      return troop.patrols[troop.patrols.length - 1].populate("members");
    }),
    updatePatrol: authenticated(
      authorized(
        "PATROL_LEADER",
        async (_, { input, id }, { prisma }) =>
          await prisma.mutation.updatePatrol({
            where: { id },
            data: { ...input },
          })
      )
    ),
    deletePatrol: authenticated(
      authorized(
        "PATROL_LEADER",
        async (_, { id }, { prisma }) =>
          await prisma.mutation.deletePatrol({ where: { id } })
      )
    ),
    updateCurrPatrol: authenticated(
      async (_, { input }, { user, prisma }) =>
        await prisma.mutation.updatePatrol({
          where: { members_some: { id: user.id } },
          data: { ...input },
        })
    ),
    deleteCurrPatrol: authenticated(
      async (_, __, { user, prisma }) =>
        await prisma.query.patrol({ where: { members_some: { id: user.id } } })
    ),
  },
};
