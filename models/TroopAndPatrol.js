import mongoose from "mongoose";

import { pointSchema } from "./Event";

export const membership = new mongoose.Schema({
  troopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Troop",
  },
  troopNumber: {
    type: String,
  },
  patrolID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patrol",
  },
  role: {
    type: String,
    enum: [
      "SCOUTMASTER",
      "ASST_SCOUTMASTER",
      "SENIOR_PATROL_LEADER",
      "ASST_PATROL_LEADER",
      "PATROL_LEADER",
      "SCOUT",
      "PARENT",
      "ADULT_VOLUNTEER",
    ],
  },
});

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

export const Patrol = mongoose.model("Patrol", patrolSchema);
const Troop = mongoose.model("Troop", troopSchema);

export default Troop;
