// const { ApolloServer } = require("apollo-server-express");
// const cron = require("node-cron");
import { ApolloServer } from "apollo-server-express";
import cron from "node-cron";

import { typeDefs as userTypes, resolvers as userResolvers } from "./User/User.js";
import { typeDefs as eventTypes, resolvers as eventResolvers } from "./Event/Event";
import {
	typeDefs as troopTypes,
	resolvers as troopResolvers
} from "./ScoutHierarchy/TroopAndPatrol";
import { typeDefs as fileTypes, resolvers as fileResolvers } from "./Event/SharedAssets";
import { typeDefs as authTypes, resolvers as authResolvers } from "./Auth/Auth";

// Models
import { UserModel, EventModel, TroopModel } from "../models/models";

import * as authFns from "./utils/Auth";
import mongoose, { Types } from "mongoose";
import { getUserNotificationData, sendNotifications } from "./Notifications/Expo";
import { isDocumentArray, isRefType } from "@typegoose/typegoose";
import { getIdFromRef } from "./utils/db";
mongoose.connect(process.env.MONGO_URL!);

const mongo = mongoose.connection;
mongo.on("error", console.error.bind(console, "connection error:"));
mongo.once("open", function () {
	console.log("Database connected!");
});

cron.schedule("* * * * *", async () => {
	const oneDayReminderEvents = await EventModel.find({
		notification: { $lte: new Date() }
	});
	if (oneDayReminderEvents.length > 0) {
		oneDayReminderEvents.map(async (event) => {
			if (!isRefType(event.troop, Types.ObjectId)) {
				throw new Error("Impossible");
			}
			const tokens = await getUserNotificationData(event.troop.toString());
			sendNotifications(
				tokens,
				`Friendly ScoutTrek Reminder that ${event.title} happens tomorrow!`,
				{ type: "event", eventType: event.type, ID: event.id }
			);
			event.notification = undefined;
			event.save();
		});
	}
});

const apolloServer = new ApolloServer({
	typeDefs: [userTypes, fileTypes, eventTypes, troopTypes, authTypes],
	resolvers: [userResolvers, fileResolvers, eventResolvers, troopResolvers, authResolvers],
	context: async ({ req }) => {
		let ret: object = {
			UserModel,
			EventModel,
			TroopModel,
			req,
			authFns
		};

		const token = authFns.getTokenFromReq(req);
		if (!token) {
			return ret;
		}
		const user = await authFns.getUserFromToken(token);

		// Update this for membership paradigm --(connie: not sure what this means but will leave the comment here )
		const membership = Array.isArray(req.headers?.membership) ? req.headers?.membership[0] : req.headers?.membership; // this is really bad... 

		const membershipIDString =
			membership === "undefined" ? undefined : new mongoose.Types.ObjectId(membership).toString();

		let currMembership;

		if (membershipIDString && user && user.groups) {
			user.populate("groups");
			if (!isDocumentArray(user.groups)) {
				throw new Error("Population failed");
			}
			currMembership = user.groups.find((membership) => {
				return membership._id.equals(membershipIDString);
			});
			ret = {
				...ret,
				tokens: currMembership ? await getUserNotificationData(getIdFromRef(currMembership.troopID).toString()): null
			}
		}

		return {
			...ret,
			membershipIDString,
			currMembership,
			user
		};
	}
});

export default apolloServer;
