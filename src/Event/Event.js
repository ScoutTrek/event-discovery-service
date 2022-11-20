import mongoose from "mongoose";

import { sendNotifications } from "../notifications";

const EventSchemas = require("./EventSchemas.json");

const { gql } = require("apollo-server-express");
const { authenticated } = require("../utils/Auth");
const GraphQLJSON = require("graphql-type-json");

export const weekDays = {
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6
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
		TROOP_MEETING
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

	# not currently in use
	type Roster {
		id: ID!
		groups: [Troop]!
		patrols: [Patrol]
		individuals: [User]
	}
	input AddRosterInput {
		groups: [ID]!
		patrols: [ID]
		individuals: [ID]
	}

	type Event {
		id: ID!

		createdAt: String!
		updatedAt: String!

		patrol: Patrol
		troop: Troop

		type: EVENT_TYPES!
		invited: [Roster]
		attending: [Roster]

		title: String!
		description: String

		date: String!
		startTime: String!
		meetTime: String
		leaveTime: String
		endTime: String
		endDate: String
		pickupTime: String

		uniqueMeetLocation: String
		location: Location
		meetLocation: Location

		checkoutTime: String
		distance: Int

		published: Boolean
		creator: User
	}

	input AddEventInput {
		type: EVENT_TYPES!
		invited: [AddRosterInput]
		attending: [AddRosterInput]

		title: String
		description: String

		date: String!
		startTime: String!
		meetTime: String
		leaveTime: String
		endTime: String
		endDate: String
		pickupTime: String

		uniqueMeetLocation: String
		location: UpdateLocationInput
		meetLocation: UpdateLocationInput

		checkoutTime: String
		distance: Int

		published: Boolean
	}

	input UpdateEventInput {
		type: EVENT_TYPES
		invited: [AddRosterInput]
		attending: [AddRosterInput]

		title: String!
		description: String

		date: String!
		startTime: String!
		uniqueMeetLocation: String
		meetTime: String
		leaveTime: String
		endTime: String
		endDate: String
		pickupTime: String

		location: UpdateLocationInput
		meetLocation: UpdateLocationInput

		checkoutTime: String
		distance: Int

		published: Boolean
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
		/** TODO: WILL HAVE @FieldResolver annotations */
		troop: async (parent, __, { TroopModel }) => {
			await TroopModel.findById(parent.troop);
		},
		patrol: async (parent, __, { TroopModel }) => {
			const myTroop = await TroopModel.findById(parent.troop);
			const myPatrol = await myTroop.patrols.id(parent.patrol);
			return myPatrol;
		},
		creator: async (parent, __, { UserModel }) => await UserModel.findById(parent.creator),
		location: (parent) => {
			if (parent.location) {
				return {
					lng: parent.location.coordinates[0],
					lat: parent.location.coordinates[1],
					address: parent.location.address
				};
			}
			return null;
		},
		meetLocation: (parent) => {
			if (parent.meetLocation) {
				return {
					lng: parent.meetLocation.coordinates[0],
					lat: parent.meetLocation.coordinates[1],
					address: parent.meetLocation.address
				};
			}
			return null;
		}
	},
	Query: {
		// events: authenticated(
		//   async (_, { first, skip }, { EventModel, currMembership }) => {
		//     const events = await EventModel.find(
		//       {
		//         date: {
		//           $gte: new Date(Date.now() - 86400000 * 1.5),
		//           $lte: new Date(Date.now() + 6.04e8 * 10),
		//         },
		//         troop: currMembership?.troopID,
		//       },
		//       null,
		//       {
		//         first,
		//         skip,
		//       }
		//     ).sort({ date: 1 });
		//     return events;
		//   }
		// ),
		// event: async (_, { id }, { EventModel }) => await EventModel.findById(id),
		// eventSchemas: () => EventSchemas
	},
	Mutation: {
		// deleteEvent: authenticated(
		// 	async (_, { id }, { EventModel }) => await EventModel.findByIdAndDelete(id)
		// ),
		addEvent: authenticated(async (_, { input }, { EventModel, user, tokens, currMembership }) => {
			if (input.type === "TROOP_MEETING") {
				input.title = "Troop Meeting";
			}

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
				notification: startDatetime - 86400000
			};

			if (input.location) {
				mutationObject.location = {
					type: "Point",
					coordinates: [input.location.lng, input.location.lat],
					address: input.location.address
				};
			}
			if (input.meetLocation) {
				mutationObject.meetLocation = {
					type: "Point",
					coordinates: [input.meetLocation.lng, input.meetLocation.lat],
					address: input.meetLocation.address
				};
			}

			const event = await EventModel.create(mutationObject);

			sendNotifications(tokens, `${input.title} event has been created. See details.`, {
				type: "event",
				eventType: event.type,
				ID: event.id
			});
			return event;
		}),
		updateEvent: authenticated(async (_, { input, id }, { EventModel, tokens }) => {
			const newVals = { ...input };
			if (input.location) {
				newVals.location = {
					type: "Point",
					coordinates: [input.location.lng, input.location.lat],
					address: input.location.address
				};
			}
			if (input.meetLocation) {
				newVals.meetLocation = {
					type: "Point",
					coordinates: [input.meetLocation.lng, input.meetLocation.lat],
					address: input.meetLocation.address
				};
			}

			await EventModel.updateOne({ _id: id }, newVals, {
				new: true
			});

			const updatedEvent = await EventModel.findById(id);

			sendNotifications(tokens, `${updatedEvent.title} event has been updated!`, {
				type: "event",
				eventType: updatedEvent.type,
				ID: updatedEvent.id
			});
			return updatedEvent;
		})
	}
};
