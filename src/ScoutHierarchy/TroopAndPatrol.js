const { gql } = require("apollo-server-express");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  type Troop {
    id: ID!
    council: String!
    state: String!
    unitNumber: Int
    city: String!
    scoutMaster: String
    meetLocation: Location
    patrols: [Patrol]
    events: [Event!]
  }

  input AddTroopInput {
    council: String!
    state: String!
    unitNumber: Int
    city: String!
    scoutMaster: String
    meetLocation: AddLocationInput
    patrols: [ID]
    events: [ID]
  }

  input UpdateTroopInput {
    council: String
    state: String
    unitNumber: Int
    city: String
    scoutMaster: String
    meetLocation: AddLocationInput
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
    patrolsOfTroop(id: ID!): [Patrol]
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
  Troop: {},
  Patrol: {
    troop: async (_, __, { TroopModel, currMembership }) =>
      await TroopModel.findById(currMembership.troopID),
    members: async (parent, __, { UserModel }) => {
      const members = await UserModel.find().where("_id").in(parent.members);
      return members;
    },

    events: async (parent, __, { EventModel }) => {
      const events = await EventModel.find().where("_id").in(parent.events);
      return events;
    },
  },
  Query: {
    troops: async (_, { limit, skip }, { TroopModel }) =>
      await TroopModel.find({}, null, { limit, skip }),
    troop: async (_, { limit, skip, id }, { TroopModel }) =>
      await TroopModel.findById(id, null, { limit, skip }),
    currTroop: authenticated(
      async (_, __, { TroopModel, currMembership }) =>
        await TroopModel.findById(currMembership.troopID, null, { limit, skip })
    ),
    patrols: async (_, __, { TroopModel, currMembership }) => {
      const myTroop = await TroopModel.findById(currMembership.troopID);
      return myTroop.patrols;
    },
    patrolsOfTroop: async (_, { id }, { Troop }) => {
      const myTroop = await TroopModel.findById(id);
      return myTroop.patrols;
    },
    patrol: async (_, { id }, { TroopModel, currMembership }) => {
      const myTroop = await TroopModel.findById(currMembership.troopID);
      return myTroop.patrols.id(id);
    },
    currPatrol: authenticated(async (_, __, { TroopModel, currMembership }) => {
      const myTroop = await TroopModel.findById(currMembership.troopID);
      return myTroop.patrols.id(currMembership.patrolID);
    }),
  },

  Mutation: {
    addTroop: async (_, { input }, { TroopModel }) => TroopModel.create(input),
    // Will need to figure out how to create a Troop and a Patrol at the same time.
    addPatrol: async (_, { troopId, input }, { Troop, user }) => {
      const troop = await TroopModel.findById(troopId);
      troop.patrols.push(input);

      troop.save(function (err) {
        if (err) return new Error(err);
      });

      return troop.patrols[troop.patrols.length - 1];
    },
    updatePatrol: authenticated(
      authorized(
        "PATROL_LEADER",
        async (_, { id, input }, { TroopModel, currMembership }) => {
          const troop = await TroopModel.findById(currMembership.troopID);
          const patrol = troop.patrols.id(id);
          const index = troop.patrols.indexOf(patrol);
          const updatedPatrol = { ...patrol, ...input };
          troop.patrols[index] = updatedPatrol;
          return await troop.save();
        }
      )
    ),
    deletePatrol: authenticated(
      authorized(
        "PATROL_LEADER",
        async (_, { id }, { TroopModel, currMembership }) => {
          // Not tested because I don't have very much data in the DB yet.
          const troop = await TroopModel.findById(currMembership.troopID);
          return troop.patrols.id(id).remove();
        }
      )
    ),
    updateCurrPatrol: authenticated(
      async (_, { input }, { TroopModel, currMembership }) => {
        const troop = await TroopModel.findById(currMembership.troopID);
        const patrol = troop.patrols.id(currMembership.patrolID);
        const index = troop.patrols.indexOf(patrol);
        const updatedPatrol = { ...patrol, ...input };
        troop.patrols[index] = updatedPatrol;
        return await troop.save();
      }
    ),
    deleteCurrPatrol: authenticated(
      async (_, __, { TroopModel, currMembership }) => {
        // Not tested because I don't have very much data in the DB yet.
        const troop = await TroopModel.findById(currMembership.troopID);
        return troop.patrols.id(user.patrol).remove();
      }
    ),
  },
};
