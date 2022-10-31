import { Schema, Types, model } from "mongoose";
import { IPoint, pointSchema } from "./Event";

export type Role = "SCOUTMASTER" | "ASST_SCOUTMASTER" | "SENIOR_PATROL_LEADER" | 
"ASST_PATROL_LEADER" | "PATROL_LEADER" | "SCOUT" | "PARENT" | "ADULT_VOLUNTEER";

export interface IMembership {
  troopID?: Types.ObjectId,
  troopNumber?: string,
  patrolID?: Types.ObjectId,
  role?: Role,
}

export interface IPatrol {
  name: string,
  members?: Types.ObjectId[],
  events?: Types.ObjectId[],
}

export interface ITroop {
  council: string,
  state: string,
  unitNumber: number,
  city?: string,
  scoutMaster?: string,
  meetLocation?: IPoint,
  patrols?: IPatrol[],
  events?: Types.ObjectId
}

export const membershipSchema = new Schema<IMembership>({
  troopID: {
    type: Schema.Types.ObjectId,
    ref: "Troop",
  },
  troopNumber: {
    type: String,
  },
  patrolID: {
    type: Schema.Types.ObjectId,
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

const patrolSchema = new Schema<IPatrol>({
  name: {
    type: String,
    required: true,
  },
  members: {
    type: [Schema.Types.ObjectId],
    ref: "User",
  },
  events: {
    type: [Schema.Types.ObjectId],
    ref: "Event",
  },
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const troopSchema = new Schema<ITroop>({
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
    type: [Schema.Types.ObjectId],
    ref: "Event",
  },
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

export const Patrol = model<IPatrol>("Patrol", patrolSchema);
const Troop = model<ITroop>("Troop", troopSchema);

export default Troop;
