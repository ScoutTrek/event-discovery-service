import Troop from "../../models/TroopAndPatrol";

import { sendNotifications } from "../Notifications/Expo";

const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");
import moment from "moment";

export const weekDays = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const getInitialDate = (target, current) => {
  target = +target;
  current = +current;
  if (target === current) {
    return 7;
  }
  if (target > current) {
    return target - current;
  } else {
    return 7 + target - current;
  }
};

export const typeDefs = gql`
  enum WEEK_DAY {
    Sunday
    Monday
    Tuesday
    Wednesday
    Thursday
    Friday
    Saturday
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
    pickupTime: String
    checkoutTime: String
    recurring: Boolean
    day: WEEK_DAY
    distance: Int
    published: Boolean!
    creator: User
    shakedown: Boolean
  }

  input UpdateEventInput {
    createdAt: String
    updatedAt: String
    title: String
    description: String
    datetime: String
    meetTime: String
    leaveTime: String
    date: String
    time: String

    startDatetime: String
    endDatetime: String
    numDays: Int

    location: UpdateLocationInput
    meetLocation: UpdateLocationInput
    pickupTime: String
    checkoutTime: String
    recurring: Boolean
    day: WEEK_DAY
    distance: Int
    published: Boolean
    creator: UpdateUserInput
    shakedown: Boolean
  }

  input AddHikeInput {
    title: String!
    description: String!
    datetime: String!
    meetTime: String
    leaveTime: String
    endDatetime: String
    pickupTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    distance: Int
    troop: ID
    patrol: ID
  }

  input AddBikeRideInput {
    title: String!
    description: String!
    datetime: String!
    meetTime: String
    leaveTime: String
    endDatetime: String
    pickupTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    distance: Int
    troop: ID
    patrol: ID
  }

  input AddCanoeingInput {
    title: String!
    description: String!
    datetime: String!
    meetTime: String
    leaveTime: String
    endDatetime: String
    pickupTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    troop: ID
    patrol: ID
  }

  input AddCampoutInput {
    title: String!
    description: String!
    datetime: String
    meetTime: String
    leaveTime: String
    endDatetime: String!
    pickupTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input AddSummerCampInput {
    title: String!
    description: String!
    datetime: String
    meetTime: String
    leaveTime: String
    pickupTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    numDays: Int
    endDatetime: String!
    # Add a packing list
    troop: ID
    patrol: ID
  }

  input AddSpecialEventInput {
    title: String!
    description: String!
    datetime: String!
    meetTime: String
    leaveTime: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    endDatetime: String!
    troop: ID
    patrol: ID
  }

  input AddScoutMeetingInput {
    title: String
    description: String
    location: AddLocationInput
    meetLocation: AddLocationInput
    datetime: String!
    meetTime: String
    leaveTime: String
    endTime: String
    pickupTime: String
    startDate: String
    endDate: String
    shakedown: Boolean
    day: WEEK_DAY
    numWeeksRepeat: Int
    troop: ID
    patrol: ID
  }

  type Location {
    lat: Float!
    lng: Float!
    address: String
  }

  input AddLocationInput {
    lat: Float!
    lng: Float!
    address: String
  }

  input UpdateLocationInput {
    lat: Float
    lng: Float
    address: String
  }

  extend type Query {
    events(first: Int, skip: Int): [Event]
    upcomingEvents(first: Int, skip: Int): [Event]
    event(id: ID!): Event

    messages(id: ID!): [Message]
  }

  extend type Mutation {
    addHike(input: AddHikeInput!): Event
    addBikeRide(input: AddBikeRideInput!): Event
    addCanoeing(input: AddCanoeingInput!): Event
    addCampout(input: AddCampoutInput!): Event
    addSummerCamp(input: AddSummerCampInput!): Event
    addScoutMeeting(input: AddScoutMeetingInput!): Event
    addSpecialEvent(input: AddSpecialEventInput!): Event

    updateEvent(input: UpdateEventInput, id: ID!): Event
    deleteEvent(id: ID!): Event

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
    troop: async (parent, __, { Troop }) => {
      await Troop.findById(parent.troop);
    },
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
          address: parent.location.address,
        };
      }
      return null;
    },
    meetLocation: (parent) => {
      if (parent.meetLocation) {
        return {
          lng: parent.meetLocation.coordinates[0],
          lat: parent.meetLocation.coordinates[1],
          address: parent.meetLocation.address,
        };
      }
      return null;
    },
  },
  Query: {
    events: authenticated(async (_, { first, skip }, { Event, user }) => {
      const events = await Event.find({ troop: user.troop }, null, {
        first,
        skip,
      });
      return events;
    }),
    upcomingEvents: async (_, { first, skip }, { Event, user }) => {
      const events = await Event.find(
        {
          datetime: {
            $gte: new Date(Date.now() - 86400000 * 1.5),
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
    },
    event: async (_, { id }, { Event }) => await Event.findById(id),
    messages: async (_, { id }, { Event }) => {
      const event = await Event.findById(id);
      return event.messages;
    },
  },
  Mutation: {
    updateEvent: authenticated(async (_, { input, id }, { Event, tokens }) => {
      const newVals = { ...input };
      if (input.location) {
        newVals.location = {
          type: "Point",
          coordinates: [input.location.lng, input.location.lat],
          address: input.location.address,
        };
      }
      if (input.meetLocation) {
        newVals.meetLocation = {
          type: "Point",
          coordinates: [input.meetLocation.lng, input.meetLocation.lat],
          address: input.meetLocation.address,
        };
      }

      const newEvent = await Event.findOneAndUpdate({ _id: id }, newVals, {
        new: true,
      });
      sendNotifications(tokens, `${newEvent.title} event has been updated!`, {
        type: "event",
        eventType: newEvent.type,
        ID: newEvent.id,
      });
      return newEvent;
    }),
    deleteEvent: authenticated(
      async (_, { id }, { Event }) => await Event.findByIdAndDelete(id)
    ),
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
          address: input.location.address,
        },
        meetLocation: {
          type: "Point",
          coordinates: [input.meetLocation.lng, input.meetLocation.lat],
          address: input.meetLocation.address,
        },
        notification: new Date(input.meetTime) - 86400000,
      };
      const event = await Event.create(hikeMutation);
      sendNotifications(
        tokens,
        `${input.title} event has been created. See details.`,
        { type: "event", eventType: event.type, ID: event.id }
      );
      return event;
    }),
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
          address: input.location.address,
        },
        meetLocation: {
          type: "Point",
          coordinates: [input.meetLocation.lng, input.meetLocation.lat],
          address: input.meetLocation.address,
        },
        notification: new Date(input.meetTime) - 86400000,
      };
      const event = await Event.create(campoutMutation);
      sendNotifications(
        tokens,
        `${input.title} event has been created. See details.`,
        { type: "event", eventType: event.type, ID: event.id }
      );
      return event;
    }),
    addBikeRide: authenticated(
      async (_, { input }, { Event, user, tokens }) => {
        const bikeRideMutation = {
          ...input,
          type: "BikeRide",
          troop: user.troop,
          patrol: user.patrol,
          creator: user.id,
          location: {
            type: "Point",
            coordinates: [input.location.lng, input.location.lat],
            address: input.location.address,
          },
          meetLocation: {
            type: "Point",
            coordinates: [input.meetLocation.lng, input.meetLocation.lat],
            address: input.meetLocation.address,
          },
          notification: new Date(input.meetTime) - 86400000,
        };
        const event = await Event.create(bikeRideMutation);
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`,
          { type: "event", eventType: event.type, ID: event.id }
        );
        return event;
      }
    ),
    addCanoeing: authenticated(
      async (_, { input }, { Event, user, tokens }) => {
        const canoeingMutation = {
          ...input,
          type: "Canoeing",
          troop: user.troop,
          patrol: user.patrol,
          creator: user.id,
          location: {
            type: "Point",
            coordinates: [input.location.lng, input.location.lat],
            address: input.location.address,
          },
          meetLocation: {
            type: "Point",
            coordinates: [input.meetLocation.lng, input.meetLocation.lat],
            address: input.meetLocation.address,
          },
          notification: new Date(input.meetTime) - 86400000,
        };
        const event = await Event.create(canoeingMutation);
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`,
          { type: "event", eventType: event.type, ID: event.id }
        );
        return event;
      }
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
            address: input.location.address,
          },
          meetLocation: {
            type: "Point",
            coordinates: [input.meetLocation.lng, input.meetLocation.lat],
            address: input.meetLocation.address,
          },
          notification: new Date(input.meetTime) - 86400000,
        };
        const event = await Event.create(campoutMutation);
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`,
          { type: "event", eventType: event.type, ID: event.id }
        );
        return event;
      }
    ),

    addScoutMeeting: authenticated(async (_, { input }, { Event, user }) => {
      for (let i = 0; i < +input.numWeeksRepeat; i++) {
        const d = new Date();
        d.setDate(d.getDate() + 7 * i);
        d.setDate(
          d.getDate() + getInitialDate(weekDays[input.day], d.getDay())
        );
        const datetime = new Date(
          `${moment(d).format("MMMM D, YYYY")} ${moment(input.datetime).format(
            "hh:mm:ss a"
          )}`
        );
        const troopMeetingMutation = {
          ...input,
          type: "TroopMeeting",
          creator: user.id,
          troop: user.troop,
          patrol: user.patrol,
          title: `Troop Meeting`,
          datetime,
          location: {
            type: "Point",
            coordinates: [input.location.lng, input.location.lat],
            address: input.location.address,
          },
          notification: new Date(datetime) - 86400000,
        };
        await Event.create(troopMeetingMutation);
      }
      return;
    }),

    addSpecialEvent: authenticated(
      async (_, { input }, { Event, user, tokens }) => {
        const specialEventMutation = {
          ...input,
          type: "SpecialEvent",
          troop: user.troop,
          patrol: user.patrol,
          creator: user.id,
          location: {
            type: "Point",
            coordinates: [input.location.lng, input.location.lat],
            address: input.location.address,
          },
          meetLocation: {
            type: "Point",
            coordinates: [input.meetLocation.lng, input.meetLocation.lat],
            address: input.meetLocation.address,
          },
          notification: new Date(input.meetTime) - 86400000,
        };
        const event = await Event.create(specialEventMutation);
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`,
          { type: "event", eventType: event.type, ID: event.id }
        );
        return event;
      }
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

        sendNotifications(otherUsers, `ScoutTrek message about ${name}.`, {
          type: "message",
          eventType: curr_event.type,
          ID: curr_event.id,
        });

        curr_event.save(function (err) {
          if (err) return new Error(err);
        });

        return curr_event.messages[curr_event.messages.length - 1];
      }
    ),
  },
};
