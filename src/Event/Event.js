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
    datetime: String!
    date: String
    time: String
    numDays: Int
    startDatetime: String
    endDatetime: String
    location: Location
    meetLocation: Location
    startDate: String
    endDate: String
    recurring: Boolean
    day: WEEK_DAY
    distance: Int
    published: Boolean!
    creator: User
    shakedown: Boolean
  }

  input AddHikeInput {
    title: String!
    description: String!
    datetime: String!
    location: AddLocationInput
    meetLocation: AddLocationInput
    distance: Int
    troop: ID
    patrol: ID
  }

  input UpdateHikeInput {
    title: String
    description: String
    datetime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    distance: Int
    troop: ID
    patrol: ID
  }

  input AddCampoutInput {
    title: String!
    description: String!
    datetime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    startDatetime: String!
    endDatetime: String!
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input UpdateCampoutInput {
    title: String
    description: String
    datetime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    startDatetime: String
    endDatetime: String
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input AddScoutMeetingInput {
    title: String!
    description: String!
    location: AddLocationInput
    meetLocation: AddLocationInput
    datetime: String!
    time: String!
    startDate: String
    endDate: String
    recurring: Boolean
    shakedown: Boolean
    day: WEEK_DAY
    troop: ID
    patrol: ID
  }

  input UpdateScoutMeetingInput {
    title: String
    description: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    datetime: String
    time: String
    startDate: String
    endDate: String
    recurring: Boolean
    shakedown: Boolean
    day: WEEK_DAY
    troop: ID
    patrol: ID
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  input AddLocationInput {
    lat: Float!
    lng: Float!
  }

  input UpdateLocationInput {
    lat: Float
    lng: Float
  }

  extend type Query {
    events(first: Int, skip: Int): [Event]
    event(id: ID!): Event

    hikes: [Event]
    hike(id: ID!): Event

    campouts: [Event]
    campout(id: ID!): Event

    scoutMeetings: [Event]
    scoutMeeting(id: ID!): Event
  }

  extend type Mutation {
    addHike(input: AddHikeInput!): Event
    updateHike(input: UpdateHikeInput!, id: ID!): Event
    deleteHike(id: ID!): Event

    addCampout(input: AddCampoutInput!): Event
    updateCampout(input: UpdateCampoutInput!, id: ID!): Event
    deleteCampout(id: ID!): Event

    addScoutMeeting(input: AddScoutMeetingInput!): Event
    updateScoutMeeting(input: UpdateScoutMeetingInput!, id: ID!): Event
    deleteScoutMeeting(id: ID!): Event
  }
`;

export const resolvers = {
  Event: {
    troop: async (parent, __, { Troop }) => await Troop.findById(parent.troop),
    patrol: async (parent, __, { Troop }) => {
      const myTroop = await Troop.findById(parent.troop);
      const myPatrol = await myTroop.patrols.id(parent.patrol);
      return myPatrol;
    },
    creator: async (parent, __, { User }) =>
      await User.findById(parent.creator),
    location: (parent) => {
      if (parent.location) {
        return {
          lng: parent.location.coordinates[0],
          lat: parent.location.coordinates[1],
        };
      }
      return null;
    },
    meetLocation: (parent) => {
      if (parent.location) {
        return {
          lng: parent.meetLocation.coordinates[0],
          lat: parent.meetLocation.coordinates[1],
        };
      }
      return null;
    },
  },
  Query: {
    events: async (_, { first, skip }, { Event, user }) => {
      const events = await Event.find({}, null, {
        first,
        skip,
      });
      return events;
    },
    event: async (_, { id }, { Event }) => await Event.findById(id),
    hike: async (_, { id }, { Event }) => await Event.findById(id),
    hikes: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "Hike" }, null, { first, skip }),
    campout: async (_, { id }, { Event }) => await Event.findById(id),
    campouts: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "Campout" }, null, { first, skip }),
    scoutMeeting: async (_, { id }, { Event }) => await Event.findById(id),
    scoutMeetings: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "ScoutMeeting" }, null, { first, skip }),
  },
  Mutation: {
    addHike: authenticated(async (_, { input }, { Event, user }) => {
      const hikeMutation = {
        ...input,
        type: "Hike",
        troop: user.troop,
        patrol: user.patrol,
        creator: user.id,
        location: {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
        },
        meetLocation: {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
        },
      };
      return await Event.create(hikeMutation);
    }),
    updateHike: authenticated(async (_, { input, id }, { Event }) => {
      const newEvent = await Event.findOneAndUpdate(
        { _id: id },
        { ...input },
        { new: true }
      );
      return newEvent;
    }),
    deleteHike: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
    addCampout: authenticated(async (_, { input }, { Event, user }) => {
      const campoutMutation = {
        ...input,
        type: "Campout",
        troop: user.troop,
        patrol: user.patrol,
        creator: user.id,
        location: {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
        },
        meetLocation: {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
        },
      };
      return await Event.create(campoutMutation);
    }),
    updateCampout: authenticated(async (_, { input, id }, { Event }) => {
      const newEvent = await Event.findOneAndUpdate(
        { _id: id },
        { ...input },
        { new: true }
      );
      return newEvent;
    }),
    deleteCampout: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
    addScoutMeeting: authenticated(async (_, { input }, { Event, user }) => {
      const scoutMeetingMutation = {
        ...input,
        type: "ScoutMeeting",
        creator: user.id,
        troop: user.troop,
        patrol: user.patrol,
        location: {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
        },
      };

      const newEvent = await Event.create(scoutMeetingMutation);

      return await Event.findById(newEvent.id)
        .populate("creator")
        .populate("troop");
    }),
    updateScoutMeeting: authenticated(
      async (_, { input, id }, { Event }) =>
        await Event.findByIdAndUpdate(id, { ...input })
    ),
    deleteScoutMeeting: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
  },
};
