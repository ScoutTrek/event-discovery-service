import Troop from "../../models/TroopAndPatrol";

import { sendNotifications } from "../Notifications/Expo";

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

  type Message {
    _id: ID!
    text: String
    image: String
    createdAt: String!
    user: User!
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
    meetTime: String!
    leaveTime: String!
    date: String
    time: String
    messages: [Message]

    startDatetime: String
    endDatetime: String
    numDays: Int

    location: Location
    meetLocation: Location
    startDate: String
    endDate: String
    checkoutTime: String
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
    meetTime: String!
    leaveTime: String!
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
    meetTime: String
    leaveTime: String
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
    meetTime: String!
    leaveTime: String!
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
    meetTime: String
    leaveTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    startDatetime: String
    endDatetime: String
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input AddSummerCampInput {
    title: String!
    description: String!
    datetime: String
    meetTime: String!
    leaveTime: String!
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    startDatetime: String!
    endDatetime: String!
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input UpdateSummerCampInput {
    title: String
    description: String
    datetime: String
    meetTime: String
    leaveTime: String
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
    meetTime: String
    leaveTime: String
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
    meetTime: String
    leaveTime: String
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
    upcomingEvents(first: Int, skip: Int): [Event]
    event(id: ID!): Event

    hikes: [Event]
    hike(id: ID!): Event

    campouts: [Event]
    campout(id: ID!): Event

    summerCamps: [Event]
    summerCamp(id: ID!): Event

    scoutMeetings: [Event]
    scoutMeeting(id: ID!): Event

    messages(id: ID!): [Message]
  }

  extend type Mutation {
    addHike(input: AddHikeInput!): Event
    updateHike(input: UpdateHikeInput!, id: ID!): Event
    deleteHike(id: ID!): Event

    addCampout(input: AddCampoutInput!): Event
    updateCampout(input: UpdateCampoutInput!, id: ID!): Event
    deleteCampout(id: ID!): Event

    addSummerCamp(input: AddSummerCampInput!): Event
    updateSummerCamp(input: UpdateSummerCampInput!, id: ID!): Event
    deleteSummerCamp(id: ID!): Event

    addScoutMeeting(input: AddScoutMeetingInput!): Event
    updateScoutMeeting(input: UpdateScoutMeetingInput!, id: ID!): Event
    deleteScoutMeeting(id: ID!): Event

    addMessage(
      eventId: ID!
      name: String
      message: String!
      image: String
    ): Message
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
  // Message: {
  //   user: async (_, { user }, { User }) => await User.findById(user),
  // },
  Query: {
    events: authenticated(async (_, { first, skip }, { Event, user }) => {
      const events = await Event.find({ troop: user.troop }, null, {
        first,
        skip,
      });
      return events;
    }),
    upcomingEvents: authenticated(
      async (_, { first, skip }, { Event, user }) => {
        const events = await Event.find(
          {
            datetime: {
              $gte: new Date(Date.now() - 86400),
              $lte: new Date(Date.now() + 6.04e8 * 8),
            },
            troop: user.troop,
          },
          null,
          {
            first,
            skip,
          }
        ).sort({ datetime: 1 });
        return events;
      }
    ),
    event: async (_, { id }, { Event }) => await Event.findById(id),
    hike: async (_, { id }, { Event }) => await Event.findById(id),
    hikes: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "Hike" }, null, { first, skip }),
    campout: async (_, { id }, { Event }) => await Event.findById(id),
    campouts: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "Campout" }, null, { first, skip }),
    summerCamp: async (_, { id }, { Event }) => await Event.findById(id),
    summerCamps: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "Campout" }, null, { first, skip }),
    scoutMeeting: async (_, { id }, { Event }) => await Event.findById(id),
    scoutMeetings: async (_, { first, skip }, { Event }) =>
      await Event.find({ type: "ScoutMeeting" }, null, { first, skip }),
    messages: async (_, { id }, { Event }) => {
      const event = await Event.findById(id);
      return event.messages;
    },
  },
  Mutation: {
    addHike: authenticated(async (_, { input }, { Event, user, tokens }) => {
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
      sendNotifications(
        tokens,
        `${input.title} event has been created. See details.`
      );
      return await Event.create(hikeMutation);
    }),
    updateHike: authenticated(async (_, { input, id }, { Event, tokens }) => {
      const newEvent = await Event.findOneAndUpdate(
        { _id: id },
        { ...input },
        { new: true }
      );
      sendNotifications(tokens, `${input.title} event has been updated!`);
      return newEvent;
    }),
    deleteHike: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
    addCampout: authenticated(async (_, { input }, { Event, user, tokens }) => {
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
      sendNotifications(
        tokens,
        `${input.title} event has been created. See details.`
      );
      return await Event.create(campoutMutation);
    }),
    updateCampout: authenticated(
      async (_, { input, id }, { Event, Troop, tokens }) => {
        const newEvent = await Event.findOneAndUpdate(
          { _id: id },
          { ...input },
          { new: true }
        );

        sendNotifications(tokens, `${input.title} event has been updated!`);

        return newEvent;
      }
    ),
    deleteCampout: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
    addSummerCamp: authenticated(
      async (_, { input }, { Event, user, tokens }) => {
        const campoutMutation = {
          ...input,
          type: "SummerCamp",
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
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`
        );
        return await Event.create(campoutMutation);
      }
    ),
    updateSummerCamp: authenticated(
      async (_, { input, id }, { Event, Troop, tokens }) => {
        const newEvent = await Event.findOneAndUpdate(
          { _id: id },
          { ...input },
          { new: true }
        );

        sendNotifications(tokens, `${input.title} event has been updated!`);

        return newEvent;
      }
    ),
    deleteSummerCamp: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
    addScoutMeeting: authenticated(
      async (_, { input }, { Event, user, tokens }) => {
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

        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`
        );

        return await Event.create(scoutMeetingMutation);
      }
    ),
    updateScoutMeeting: authenticated(
      async (_, { input, id }, { Event, tokens }) => {
        const newEvent = await Event.findOneAndUpdate(
          { _id: id },
          { ...input },
          { new: true }
        );

        sendNotifications(tokens, `${input.title} event has been updated!`);

        return newEvent;
      }
    ),
    deleteScoutMeeting: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),

    addMessage: authenticated(
      async (_, { eventId, name, message, image }, { user, Event, tokens }) => {
        const curr_event = await Event.findById(eventId);
        let newMessage;
        if (!image) {
          newMessage = {
            text: message,
            user: {
              _id: user.id,
              name: user.name,
            },
          };
        } else {
          newMessage = {
            text: message,
            image: image,
            user: {
              _id: user.id,
              name: user.name,
            },
          };
        }

        curr_event.messages.push(newMessage);

        const otherUsers = tokens.filter(
          (token) => token !== user.expoNotificationToken
        );

        sendNotifications(otherUsers, `ScoutTrek message about ${name}.`);

        curr_event.save(function (err) {
          if (err) return new Error(err);
        });

        return curr_event.messages[curr_event.messages.length - 1];
      }
    ),
  },
};
