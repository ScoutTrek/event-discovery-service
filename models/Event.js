import mongoose from "mongoose";
import { rosterSchema } from "./Roster";

export const pointSchema = new mongoose.Schema({
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

export const messageUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

export const messageSchema = new mongoose.Schema({
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

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    troop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Troop",
      required: true,
    },
    patrol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patrol",
      required: "true",
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
      type: mongoose.Schema.Types.ObjectId,
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

eventSchema.virtual("time").get(function () {
  let date = new Date(this.datetime);
  const formattedDate =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return formattedDate;
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
