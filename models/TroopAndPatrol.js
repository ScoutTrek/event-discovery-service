import mongoose from "mongoose";

import { pointSchema } from "./Event";

const patrolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    events: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Event",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const troopSchema = new mongoose.Schema(
  {
    council: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    unitNumber: {
      type: Number,
      required: true,
    },
    city: String,
    scoutMaster: String,
    meetLocation: pointSchema,
    patrols: [patrolSchema],
    events: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Event",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const Troop = mongoose.model("Troop", troopSchema);

export default Troop;
