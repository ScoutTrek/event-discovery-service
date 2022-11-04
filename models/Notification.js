import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";

export const notificationSchema = new mongoose.Schema(
	{
		title: String,
		type: String,
		eventType: String,
		eventID: String
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true
	}
);
