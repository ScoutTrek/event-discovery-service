import { Schema, Types, model } from "mongoose";
import { createSchema, Type, typedModel } from "ts-mongoose";
import { Type } from "typescript";
import { IRoster, rosterSchema } from "./Roster";
import { patrolSchema, troopSchema } from "./TroopAndPatrol";
import { userSchema } from "./User";

export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

// export interface IPoint {
//   type: string,
//   coordinates: Types.Array<number>,
//   address?: string,
// }

// export interface IMessageUser {
//   name: string,
// }

// export interface IMessage {
//   text?: string,
//   image?: string,
//   createdAt?: Date,
//   user?: IMessageUser,
// }

// interface IEvent {
//   type: string,
//   troop: Types.ObjectId,
//   patrol: Types.ObjectId,
//   title: string,
//   description?: string,
//   date: Date,
//   endDate?: Date,
//   startTime?: Date,
//   uniqueMeetLocation?: string,
//   meetTime?: Date,
//   leaveTime?: Date,
//   pickupTime?: Date,
//   endTime?: Date,
//   location?: IPoint,
//   meetLocation?: IPoint,
//   messages?: Types.DocumentArray<IMessage>,
//   invited?: IRoster,
//   attending?: IRoster,
//   day?: Day;
//   distance?: number,
//   shakedown?: boolean,
//   published?: boolean,
//   creator?: Types.ObjectId,
//   notification?: Date,
// }

export const pointSchema = createSchema({
  type: Type.string({ required: true, enum: ["Point"] as const }),
  coordinates: Type.array({ required: true }).of(Type.number()),
  address: Type.string()
});

export const messageUserSchema = createSchema({
  name: Type.string({ required: true })
});

export const messageSchema = createSchema({
  text: Type.string(),
  image: Type.string(),
  // TODO: Date.now or Date.now()?
  createdAt: Type.date({ default: Date.now }),
  user: Type.schema().of(messageUserSchema)
});

export const eventSchema = createSchema({
  type: Type.string({ required: true }),
  troop: Type.ref(Type.objectId({ required: true })).to("Troop", troopSchema),
  patrol: Type.ref(Type.objectId({ required: true })).to("Patrol", patrolSchema),
  title: Type.string({ required: true, message: "An event cannot have a blank title." }),
  description: Type.string(),
  date: Type.date(),
  endDate: Type.date(),
  startTime: Type.date(),
  uniqueMeetLocation: Type.string(),
  meetTime: Type.date(),
  leaveTime: Type.date(),
  pickupTime: Type.date(),
  endTime: Type.date(),
  location: Type.schema().of(pointSchema),
  meetLocation: Type.schema().of(pointSchema),
  messages: Type.array().of(messageSchema),
  invited: Type.schema().of(rosterSchema),
  attending: Type.schema().of(rosterSchema),
  day: Type.string({
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ] as const
  }),
  distance: Type.number(),
  shakedown: Type.boolean(),
  published: Type.boolean(),
  creator: Type.ref(Type.objectId()).to("User", userSchema),
  notification: Type.date(),
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

eventSchema.virtual("time").get(function () {
  let date = new Date(this.date);
  const formattedDate =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return formattedDate;
});

const Event = typedModel("Event", eventSchema);

export default Event;
