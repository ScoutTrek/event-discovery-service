import { Schema, Types, model } from "mongoose";
import { IRoster, rosterSchema } from "./Roster";

export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface IPoint {
  type: string,
  coordinates: Types.Array<number>,
  address?: string,
}

export interface IMessageUser {
  name: string,
}

export interface IMessage {
  text?: string,
  image?: string,
  createdAt?: Date,
  user?: IMessageUser,
}

interface IEvent {
  type: string,
  troop: Types.ObjectId, 
  patrol: Types.ObjectId, 
  title: string,
  description?: string,
  date: Date,
  endDate?: Date,
  startTime?: Date,
  uniqueMeetLocation?: string,
  meetTime?: Date,
  leaveTime?: Date,
  pickupTime?: Date,
  endTime?: Date,
  location?: IPoint,
  meetLocation?: IPoint,
  messages?: Types.DocumentArray<IMessage>,
  invited?: IRoster,
  attending?: IRoster,
  day?: Day;
  distance?: number,
  shakedown?: boolean,
  published?: boolean,
  creator?: Types.ObjectId, 
  notification?: Date,
}

export const pointSchema = new Schema<IPoint>({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  address: {
    type: String,
  },
});

export const messageUserSchema = new Schema<IMessageUser>({
  name: {
    type: String,
    required: true,
  },
});

export const messageSchema = new Schema<IMessage>({
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: messageUserSchema,
});

const eventSchema = new Schema<IEvent>({
  type: {
    type: String,
    required: true,
  },
  troop: {
    type: Schema.Types.ObjectId,
    ref: "Troop",
    required: true,
  },
  patrol: {
    type: Schema.Types.ObjectId,
    ref: "Patrol",
    required: true,
  },
  title: {
    type: String,
    required: [true, "An event cannot have a blank title."],
  },
  description: String,
  date: Date,
  endDate: Date,
  startTime: Date,
  uniqueMeetLocation: String,
  meetTime: Date,
  leaveTime: Date,
  pickupTime: Date,
  endTime: Date,
  location: pointSchema,
  meetLocation: pointSchema,
  messages: [messageSchema],
  invited: rosterSchema,
  attending: rosterSchema,
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  distance: Number,
  shakedown: Boolean,
  published: Boolean,
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  notification: Date,
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

eventSchema.virtual("time").get(function (this: IEvent) {
  let date = new Date(this.date);
  const formattedDate =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return formattedDate;
});

const Event = model<IEvent>("Event", eventSchema);

export default Event;
