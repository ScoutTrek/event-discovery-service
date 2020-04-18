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
    troops: [Troop]
    troop(id: ID!): Troop!
    currTroop: Troop!
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
    troops: async (_, { limit, skip }, { Troop }) =>
      await Troop.find({}, null, { limit, skip }),
    troop: async (_, { id }, { Troop }) =>
      await Troop.findById(id, null, { limit, skip }),
    currTroop: authenticated(
      async (_, __, { Troop, user }) =>
        await Troop.findById(user.troop, null, { limit, skip })
    ),
    patrols: async (_, __, { Troop, user }) => {
      const myTroop = await Troop.findById(user.troop);
      return myTroop.patrols;
    },
    patrol: async (_, { id }, { Troop, user }) => {
      const myTroop = await Troop.findById(user.troop);
      return myTroop.patrols.id(id);
    },
    currPatrol: authenticated(async (_, __, { Troop, user }) => {
      const myTroop = await Troop.findById(user.troop);
      return myTroop.patrols.id(user.patrol);
    }),
  },

  Mutation: {
    addTroop: authenticated(async (_, { input }, { Troop }) =>
      Troop.create(input)
    ),
    // Will need to figure out how to create a Troop and a Patrol at the same time.
    addPatrol: authenticated(async (_, { troopId, input }, { Troop, user }) => {
      const troop = await Troop.findById(troopId);
      troop.patrols.push(input);

      troop.save(function(err) {
        if (err) return new Error(err);
      });

      return troop.patrols[troop.patrols.length - 1].populate("members");
    }),
    updatePatrol: authenticated(
      authorized("PATROL_LEADER", async (_, { id, input }, { Troop, user }) => {
        const troop = await Troop.findById(user.troop);
        const patrol = troop.patrols.id(id);
        const index = troop.patrols.indexOf(patrol);
        const updatedPatrol = { ...patrol, ...input };
        troop.patrols[index] = updatedPatrol;
        return await troop.save();
      })
    ),
    deletePatrol: authenticated(
      authorized("PATROL_LEADER", async (_, { id }, { Troop }) => {
        // Not tested because I don't have very much data in the DB yet.
        const troop = await Troop.findById(user.troop);
        return troop.patrols.id(id).remove();
      })
    ),
    updateCurrPatrol: authenticated(async (_, { input }, { Troop, user }) => {
      const troop = await Troop.findById(user.troop);
      const patrol = troop.patrols.id(user.patrol);
      const index = troop.patrols.indexOf(patrol);
      const updatedPatrol = { ...patrol, ...input };
      troop.patrols[index] = updatedPatrol;
      return await troop.save();
    }),
    deleteCurrPatrol: authenticated(async (_, __, { Troop, user }) => {
      // Not tested because I don't have very much data in the DB yet.
      const troop = await Troop.findById(user.troop);
      return troop.patrols.id(user.patrol).remove();
    }),
  },
};
