import mongoose from "mongoose";

import { sendNotifications } from "../Notifications/Expo";

const EventSchemas = require("./EventSchemas.json");

const { gql } = require("apollo-server");
const { authenticated, authorized } = require("../utils/Auth");
const GraphQLJSON = require("graphql-type-json");
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
  scalar JSON

  enum WEEK_DAY {
    Sunday
    Monday
    Tuesday
    Wednesday
    Thursday
    Friday
    Saturday
  }

  enum EVENT_TYPES {
    AQUATIC_EVENT
    BACKPACK_TRIP
    BIKE_RIDE
    BOARD_OF_REVIEW
    CAMPOUT
    CANOE_TRIP
    COMMITTEE_MEETING
    CUSTOM_EVENT
    EAGLE_PROJECT
    FISHING_TRIP
    FLAG_RETIREMENT
    FUNDRAISER
    GROUP_MEETING
    HIKE
    KAYAK_TRIP
    MERIT_BADGE_CLASS
    PARENT_MEETING
    SCOUTMASTER_CONFERENCE
    SERVICE_PROJECT
    SPECIAL_EVENT
    SUMMER_CAMP
    SWIM_TEST
  }

  type Message {
    _id: ID!
    text: String
    image: String
    createdAt: String!
    user: User!
  }

  type Roster {
    id: ID!
    groups: [Troop]!
    patrols: [Patrol]
    individuals: [User]
  }

  type Event {
    id: ID!
    type: EVENT_TYPES!
    createdAt: String!
    updatedAt: String!
    invited: [Roster]
    attending: [Roster]
    patrol: Patrol
    troop: Troop
    title: String!
    description: String
    date: String!
    endDate: String
    startTime: String!
    uniqueMeetLocation: String
    meetTime: String
    leaveTime: String
    pickupTime: String
    endTime: String

    messages: [Message]

    location: Location
    meetLocation: Location

    checkoutTime: String
    recurring: Boolean
    day: WEEK_DAY
    distance: Int
    published: Boolean!
    creator: User
    shakedown: Boolean
  }

  input AddRosterInput {
    groups: [ID]!
    patrols: [ID]
    individuals: [ID]
  }

  input AddEventInput {
    type: EVENT_TYPES!
    invited: [AddRosterInput]
    creator: UpdateUserInput
    published: Boolean

    title: String!
    description: String
    date: String!
    endDate: String
    startTime: String!
    uniqueMeetLocation: String
    meetTime: String
    leaveTime: String
    endTime: String
    pickupTime: String

    location: UpdateLocationInput
    meetLocation: UpdateLocationInput

    recurring: Boolean
    day: WEEK_DAY
    distance: Int

    shakedown: Boolean
  }

  input UpdateEventInput {
    type: EVENT_TYPES!
    invited: [AddRosterInput]
    creator: UpdateUserInput
    published: Boolean

    title: String!
    description: String
    date: String!
    endDate: String
    startTime: String!
    uniqueMeetLocation: String
    meetTime: String
    leaveTime: String
    endTime: String
    pickupTime: String

    location: UpdateLocationInput
    meetLocation: UpdateLocationInput

    recurring: Boolean
    day: WEEK_DAY
    distance: Int

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
    event(id: ID!): Event
    messages(id: ID!): [Message]
    eventSchemas: JSON
  }

  extend type Mutation {
    addEvent(input: AddEventInput!): Event

    updateEvent(input: UpdateEventInput, id: ID!): Event
    deleteEvent(id: ID!): Event
  }
`;

export const resolvers = {
  JSON: GraphQLJSON,
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
    events: authenticated(
      async (_, { first, skip }, { Event, currMembership }) => {
        const events = await Event.find(
          {
            date: {
              $gte: new Date(Date.now() - 86400000 * 1.5),
              $lte: new Date(Date.now() + 6.04e8 * 10),
            },
            troop: currMembership?.troopID,
          },
          null,
          {
            first,
            skip,
          }
        ).sort({ date: 1 });
        return events;
      }
    ),
    event: async (_, { id }, { Event }) => await Event.findById(id),
    messages: async (_, { id }, { Event }) => {
      const event = await Event.findById(id);
      return event.messages;
    },
    eventSchemas: () => EventSchemas,
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
    addEvent: authenticated(
      async (_, { input }, { Event, user, tokens, currMembership }) => {
        // combines the event date and time into one date object
        // could be turned into a utility function in the future
        let startDatetime = new Date(input?.meetTime || input?.startTime);
        const eventDate = new Date(input?.date);
        startDatetime.setMonth(eventDate.getMonth());
        startDatetime.setDate(eventDate.getDate());
        const mutationObject = {
          ...input,
          troop: currMembership?.troopID,
          patrol: currMembership?.patrolID,
          creator: user.id,
          notification: startDatetime - 86400000,
        };

        if (input.location) {
          mutationObject.location = {
            type: "Point",
            coordinates: [input.location.lng, input.location.lat],
            address: input.location.address,
          };
        }
        if (input.meetLocation) {
          mutationObject.meetLocation = {
            type: "Point",
            coordinates: [input.meetLocation.lng, input.meetLocation.lat],
            address: input.meetLocation.address,
          };
        }

        const event = await Event.create(mutationObject);
        sendNotifications(
          tokens,
          `${input.title} event has been created. See details.`,
          { type: "event", eventType: event.type, ID: event.id }
        );
        return event;
      }
    ),

    // addScoutMeeting: authenticated(
    //   async (_, { input }, { Event, user, membershipIDString }) => {
    //     for (let i = 0; i < +input.numWeeksRepeat; i++) {
    //       const d = new Date();
    //       d.setDate(d.getDate() + 7 * i);
    //       d.setDate(
    //         d.getDate() + getInitialDate(weekDays[input.day], d.getDay())
    //       );
    //       const datetime = new Date(
    //         `${moment(d).format("MMMM D, YYYY")} ${moment(
    //           input.datetime
    //         ).format("hh:mm:ss a")}`
    //       );
    //       const troopMeetingMutation = {
    //         ...input,
    //         type: "TroopMeeting",
    //         creator: user.id,
    //         troop: user.groups.find(
    //           (membership) => membership.troop === membershipIDString
    //         ),
    //         patrol: user.patrol,
    //         title: `Troop Meeting`,
    //         datetime,
    //         location: {
    //           type: "Point",
    //           coordinates: [input.location.lng, input.location.lat],
    //           address: input.location.address,
    //         },
    //         notification: new Date(datetime) - 86400000,
    //       };
    //       await Event.create(troopMeetingMutation);
    //     }
    //     return;
    //   }
    // ),
  },
};
