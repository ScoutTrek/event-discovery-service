// const { ApolloServer } = require("apollo-server-express");
// const cron = require("node-cron");
import { DocumentType, isRefType } from '@typegoose/typegoose';
import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import mongoose, { Types } from 'mongoose';
import cron from 'node-cron';
import { buildSchema } from 'type-graphql';

import { Event } from '../models/Event';
import { EventModel, TroopModel, UserModel } from '../models/models';
import { Membership, Troop } from '../models/TroopAndPatrol';
import { User } from '../models/User';
import { AuthResolver } from './Auth/Auth';
import { TypegooseMiddleware } from './middleware/typegoose_middlware';
import { getUserNotificationData, sendNotifications, UserData } from './Notifications/Expo';
import { PatrolResolver, TroopResolver } from './ScoutHierarchy/TroopAndPatrol';
import { UserResolver } from './User/User';
import * as authFns from './utils/Auth';

import type { ReturnModelType } from '@typegoose/typegoose';
// import { typeDefs as eventTypes, resolvers as eventResolvers } from "./Event/Event";
// import { typeDefs as fileTypes, resolvers as fileResolvers } from "./Event/SharedAssets";

// Models
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

export interface ContextType {
	UserModel: ReturnModelType<typeof User>,
	EventModel: ReturnModelType<typeof Event>,
	TroopModel: ReturnModelType<typeof Troop>,
	req: Request,
	authFns: typeof authFns,
	tokens?: UserData[] | null,
	membershipIDString?: string,
	currMembership?: DocumentType<Membership>,
	user?: DocumentType<User>
}

async function bootstrap() {
	try {
		// build TypeGraphQL executable schema
		const schema = await buildSchema({
			resolvers: [AuthResolver, UserResolver, TroopResolver, PatrolResolver],
			globalMiddlewares: [TypegooseMiddleware],
			authChecker: authFns.customAuthChecker,
		});

		// Create GraphQL server
		const server = new ApolloServer({
			schema,
			context: async ({ req }) => {
				let ret: ContextType = {
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
		
				const membershipIDString = membership === "undefined" ? undefined : new mongoose.Types.ObjectId(membership).toString();
		
				if (membershipIDString && user && user.groups) {
					ret.membershipIDString = membershipIDString;
					ret.user = user;
					const currMembership = user.groups.find((membership) => {
						return membership._id.equals(membershipIDString);
					});
					if (currMembership) {
						// ret.tokens = await getUserNotificationData(getIdFromRef(currMembership.troopID).toString());
						ret.currMembership = currMembership;
					}
				}
		
				return ret;
			},
		});

		return server;
	} catch (err) {
		console.error(err);
	}
}

const apolloServer = bootstrap();

export default apolloServer;
