import { membership } from "../../models/TroopAndPatrol";

import mongoose from "mongoose";
const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  enum ROLE {
    SCOUTMASTER
    ASST_SCOUTMASTER
    SENIOR_PATROL_LEADER
    PATROL_LEADER
    SCOUT
    PARENT
    ADULT_VOLUNTEER
  }

  type Membership {
    id: ID!
    troopID: ID!
    troopNum: String!
    patrolID: ID!
    role: ROLE!
  }

  input AddMembershipInput {
    troopID: ID!
    troopNum: String!
    patrolID: ID!
    role: ROLE!
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
    groups: [Membership]
    troop: Troop
    patrol: Patrol
    role: ROLE
    events: Event
    children: [String]
  }

  type AddMembershipPayload {
    groupID: ID!
    groupNum: String!
  }

  type CurrUser {
    id: ID!
    expoNotificationToken: String!
    createdAt: String
    updatedAt: String
    name: String!
    email: String!
    phone: String
    birthday: String
    age: Int
    patrol: Patrol
    troop: Troop
    otherGroups: [Membership]
    role: ROLE
    events: Event
    children: [String]
  }

  input AddUserInput {
    name: String!
    email: String!
    expoNotificationToken: String
    password: String!
    phone: String
    birthday: String
    troop: ID
    patrol: ID
    role: ROLE
    groups: [AddMembershipInput!]!
    children: [String]
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
    groups: [AddMembershipInput]
    children: [String]
  }

  type Query {
    users(limit: Int, skip: Int): [User]
    user(id: ID!): User
    currUser: CurrUser!
  }

  type Mutation {
    addGroup(input: AddMembershipInput): AddMembershipPayload
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
    troop: async (parent, __, { Troop, Membership, membershipIDString }) => {
      const curr_membership = parent?.troop
        ? parent?.troop
        : await Membership.findById(membershipIDString);
      return await Troop.findById(curr_membership);
    },
    patrol: async (_, __, { Troop, Membership, membershipIDString }) => {
      const curr_membership = await Membership.findById(membershipIDString);
      const myTroop = await Troop.findById(curr_membership.troopId);
      const myPatrol = await myTroop.patrols.id(curr_membership.troopId);
      return myPatrol;
    },
  },
  Query: {
    user: authenticated(async (_, { id }, { User }) => await User.findById(id)),
    users: authenticated(async (_, { limit, skip }, { User }) => {
      return await User.find({}, null, { limit, skip });
    }),
    currUser: authenticated(
      async (_, __, { Troop, membershipIDString, user }) => {
        const userObj = JSON.parse(JSON.stringify(user));

        if (!user.groups.length) {
          // send admin a message that there is an invalid user
          return { ...userObj, id: userObj?._id };
        }

        const myGroup = userObj?.groups?.find((group) => {
          console.log("Group ID ", group?._id);
          return group?._id === membershipIDString;
        });

        const currGroupIndex = userObj?.groups?.findIndex(
          (group) => group?._id === membershipIDString
        );
        const troop = await Troop.findById(
          user.groups?.[currGroupIndex >= 0 ? currGroupIndex : 0]["troopID"]
        );

        const myTroopObj = JSON.parse(JSON.stringify(troop));
        const patrol = troop.patrols.id(
          user.groups?.[currGroupIndex >= 0 ? currGroupIndex : 0]["patrolID"]
        );
        const myPatrolObj = JSON.parse(JSON.stringify(patrol));

        let otherGroups = [];
        if (userObj?.groups?.length > 1) {
          otherGroups = userObj?.groups?.filter(
            (group) => group?._id !== membershipIDString
          );
        }
        console.log("Curr membership id ", membershipIDString);
        console.log("My group ", myGroup);
        return {
          ...userObj,
          id: userObj?._id,
          patrol: {
            ...myPatrolObj,
            id: myPatrolObj._id,
          },
          troop: {
            ...myTroopObj,
            id: myTroopObj._id,
          },
          role: myGroup?.role,
          otherGroups: otherGroups.map((group) => ({
            ...group,
            id: group?._id,
          })),
        };
      }
    ),
  },
  Mutation: {
    addGroup: authenticated(async (_, { input }, { user, User }) => {
      const newGroupID = mongoose.Types.ObjectId();
      await User.findById(user.id, function (err, doc) {
        if (err) return false;
        const groups = doc.groups;
        groups.push({ _id: newGroupID, ...input });
        doc.save();
      });
      return {
        groupID: newGroupID,
      };
    }),
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
