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

  type Patrol {
    id: ID!
    name: String!
    members: [User!]!
    events: [Event!]
  }

  input UpdatePatrol {
    name: String!
    members: [ID!]
    events: [ID!]
  }

  extend type Query {
    patrols: [Patrol]
    patrol(id: ID!): Patrol!
    currPatrol: Patrol!
  }

  extend type Mutation {
    addPatrol(input: UpdatePatrol): Patrol
    updatePatrol: Patrol
    updateCurrPatrol: Patrol
    deletePatrol: Patrol
    deleteCurrPatrol: Patrol
  }
`;

export const resolvers = {
  Query: {
    patrols: async (_, __, { prisma }, info) =>
      await prisma.query.patrols(null, info),
    patrol: async (_, { id }, { prisma }) =>
      await prisma.query.patrol({ where: { id } }),
    currPatrol: authenticated(
      async (_, __, { user }) =>
        await prisma.query.patrols({ where: { members_some: { id: user.id } } })
    )
  },

  Mutation: {
    addPatrol: authenticated(async (_, { input }, { prisma }) => {
      const { members, events, ...rest } = input;
      const membersWithIDLabel = [];
      members.map(id => membersWithIDLabel.push({ id }));

      const eventsWithIDLabel = [];
      events.map(id => eventsWithIDLabel.push({ id }));

      const patrolMutation = {
        ...rest,
        members: {
          connect: membersWithIDLabel
        },
        events: {
          connect: eventsWithIDLabel
        }
      };
      return await prisma.mutation.createPatrol({ data: patrolMutation });
    }),
    updatePatrol: authenticated(
      authorized(
        "PATROL_LEADER",
        async (_, { input, id }, { prisma }) =>
          await prisma.mutation.updatePatrol({
            where: { id },
            data: { ...input }
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
          data: { ...input }
        })
    ),
    deleteCurrPatrol: authenticated(
      async (_, __, { user, prisma }) =>
        await prisma.query.patrol({ where: { members_some: { id: user.id } } })
    )
  }
};
