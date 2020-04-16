const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");

export const typeDefs = gql`
  enum WEEK_DAY {
    SUNDAY
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
  }

  type Event {
    id: ID!
    type: String!
    createdAt: String!
    updatedAt: String!
    patrol: Patrol
    troop: Troop
    title: String!
    description: String
    date: String
    time: String
    location: Location!
    meetLocation: Location
    startDate: String
    endDate: String
    recurring: Boolean
    day: WEEK_DAY
    distance: Int
    published: Boolean!
    owner: User
  }

  type Hike {
    id: ID!
    owner: User!
    title: String!
    description: String!
    date: String!
    location: Location
    meetLocation: Location
    distance: Int
  }

  input HikeInput {
    title: String
    description: String
    date: String
    location: CreateLocationInput
    meetLocation: CreateLocationInput
    distance: Int
  }

  type ScoutMeeting {
    id: ID!
    title: String!
    description: String!
    date: String
    location: Location!
    meetLocation: Location
    startDate: String!
    endDate: String
    recurring: Boolean
    day: WEEK_DAY
  }

  input ScoutMeetingInput {
    title: String
    description: String
    date: String
    location: CreateLocationInput
    meetLocation: CreateLocationInput
    startDate: String
    endDate: String
    recurring: Boolean
    day: WEEK_DAY
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  input LocationInput {
    lat: Float!
    lng: Float!
  }

  input LocationUpdateInput {
    lat: Float
    lng: Float
  }

  input CreateLocationInput {
    create: LocationInput
  }

  extend type Query {
    events(first: Int, skip: Int): [Event]
    hikes: [Hike]
    hike(id: ID!): Hike
    scoutMeetings: [ScoutMeeting]
    scoutMeeting(id: ID!): ScoutMeeting
  }

  extend type Mutation {
    addHike(input: HikeInput!): Hike
    updateHike(input: HikeInput!, id: ID!): Hike
    deleteHike(id: ID!): Hike
    addScoutMeeting(input: ScoutMeetingInput!): ScoutMeeting
    updateScoutMeeting(input: ScoutMeetingInput!, id: ID!): ScoutMeeting
    deleteScoutMeeting(id: ID!): ScoutMeeting
  }
`;

export const resolvers = {
  // Event: {
  //   location: async (parent, args, { prisma }, info) => {
  //     return await prisma.query.events({ id: parent.id }).location();
  //   }
  // },
  // Hike: {
  //   location: async (parent, args, { prisma }, info) => {
  //     return await prisma.query.events({ id: parent.id }).location();
  //   }
  // },
  // ScoutMeeting: {
  //   location: async (parent, args, { prisma }, info) => {
  //     console.log(await prisma.query.events({ id: parent.id }));
  //     return await prisma.events({ id: parent.id }).location;
  //   }
  // },
  Query: {
    events: async (_, { first, skip }, { prisma }, info) =>
      await prisma.query.events({ first, skip }, info),
    hike: async (_, { id }, { prisma }, info) =>
      await prisma.query.users(null, info),
    hikes: async (_, __, { prisma }, info) =>
      await prisma.query.events({ where: { type: "Hike" } }, info),
    scoutMeetings: async (_, { id }, { prisma }, info) =>
      await prisma.query.users(null, info),
    scoutMeeting: async (_, __, { prisma }, info) =>
      await prisma.query.users(null, info)
  },
  Mutation: {
    addHike: authenticated(async (_, { input }, { user, prisma }) => {
      const hikeMutation = {
        ...input,
        type: "Hike",
        owner: {
          connect: {
            id: user.id
          }
        }
      };

      return await prisma.mutation.createEvent({
        data: hikeMutation
      });
    }),

    updateHike: authenticated(
      async (_, { input, id }, { prisma }) =>
        await prisma.mutation.updateEvent({
          where: { id },
          data: { ...input }
        })
    ),
    deleteHike: authenticated(
      async (_, { id }, { prisma }) =>
        await prisma.mutation.deleteEvent({ where: { id } })
    ),
    addScoutMeeting: authenticated(async (_, { input }, { user, prisma }) => {
      const scoutMeetingMutation = {
        ...input,
        type: "Scout Meeting",
        owner: {
          connect: {
            id: user.id
          }
        }
      };

      return await prisma.createEvent({
        data: scoutMeetingMutation
      });
    }),
    updateScoutMeeting: authenticated(
      async (_, { input, id }, { prisma }) =>
        await prisma.mutation.updateEvent({
          where: { id },
          data: { ...input }
        })
    ),
    deleteScoutMeeting: authenticated(
      async (_, { id }, { prisma }) =>
        await prisma.mutation.deleteEvent({ where: { id } })
    )
  }
};
