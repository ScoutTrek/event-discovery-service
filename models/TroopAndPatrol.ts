import { modelOptions, prop } from "@typegoose/typegoose";
import type { Ref, ArraySubDocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Point } from "./Event";
import { User } from "./User";

export enum ROLE {
  "SCOUTMASTER",
  "ASST_SCOUTMASTER",
  "SENIOR_PATROL_LEADER",
  "ASST_PATROL_LEADER",
  "PATROL_LEADER",
  "SCOUT",
  "PARENT",
  "ADULT_VOLUNTEER",
}

export class Membership {
  @prop({ required: true, ref: () => Troop })
  public troopID!: Ref<Troop>;

  @prop({ required: true })
  public troopNumber!: string;

  @prop({ required: true, ref: () => Patrol })
  public patrolID!: Ref<Patrol>;

  @prop({ required: true, enum: ROLE })
  public role!: ROLE;
}

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
})
export class Patrol {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true, ref: () => User, default: [] })
  public members!: Ref<User>[];

  // @prop({ required: true, ref: () => Event, default: [] })
  // public events!: Ref<Event>[];
}

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
})
export class Troop {
  @prop({ required: true })
  public council!: string;

  @prop({ required: true })
  public state!: string;

  @prop({ required: true })
  public unitNumber!: number;

  @prop()
  public city?: string;

  @prop()
  public scoutMaster?: string;

  @prop()
  public meetLocation?: Point;

  @prop({ required: true, type: () => Patrol, default: [] })
  public patrols!: mongoose.Types.DocumentArray<ArraySubDocumentType<Patrol>>;

  // @prop({ ref: () => Event })
  // public events?: Ref<Event>[];
}
