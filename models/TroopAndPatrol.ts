import { Schema, Types, model } from "mongoose";
import { createSchema, Type } from "ts-mongoose";
import { eventSchema, IPoint, pointSchema } from "./Event";
import { userSchema } from "./User";

export type Role = "SCOUTMASTER" | "ASST_SCOUTMASTER" | "SENIOR_PATROL_LEADER" |
  "ASST_PATROL_LEADER" | "PATROL_LEADER" | "SCOUT" | "PARENT" | "ADULT_VOLUNTEER";

// export interface IMembership {
//   troopID?: Types.ObjectId,
//   troopNumber?: string,
//   patrolID?: Types.ObjectId,
//   role?: Role,
// }

// export interface IPatrol {
//   name: string,
//   members?: Types.ObjectId[],
//   events?: Types.ObjectId[],
// }

// export interface ITroop {
//   council: string,
//   state: string,
//   unitNumber: number,
//   city?: string,
//   scoutMaster?: string,
//   meetLocation?: IPoint,
//   patrols?: Types.DocumentArray<IPatrol>,
//   events: Types.ObjectId[]
// }

export const patrolSchema = createSchema({
  name: Type.string({ required: true }),
  members: Type.ref(Type.objectId()).to("User", userSchema),
  events: Type.ref(Type.objectId()).to("Event", eventSchema)
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

export const troopSchema = createSchema({
  council: Type.string({ required: true }),
  state: Type.string({ required: true }),
  unitNumber: Type.number({ required: true }),
  city: Type.string(),
  scoutMaster: Type.string(),
  meetLocation: Type.schema().of(pointSchema),
  patrols: Type.array().of(patrolSchema),
  events: Type.ref(Type.objectId()).to("Event", eventSchema)
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const memberRoles = [
  "SCOUTMASTER",
  "ASST_SCOUTMASTER",
  "SENIOR_PATROL_LEADER",
  "ASST_PATROL_LEADER",
  "PATROL_LEADER",
  "SCOUT",
  "PARENT",
  "ADULT_VOLUNTEER",
] as const;

export const membershipSchema = createSchema({
  troopID: Type.ref(Type.objectId()).to("Troop", troopSchema),
  troopNumber: Type.string(),
  patrolID: Type.ref(Type.objectId()).to("Patrol", patrolSchema),
  role: Type.string({ enum: memberRoles })
});

export const Patrol = model<IPatrol>("Patrol", patrolSchema);
const Troop = model<ITroop>("Troop", troopSchema);

export default Troop;
