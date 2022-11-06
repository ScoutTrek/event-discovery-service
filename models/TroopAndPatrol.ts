import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose";
import { Point } from "./Event";
import { User } from "./User";

export const ROLES = [
  "SCOUTMASTER",
  "ASST_SCOUTMASTER",
  "SENIOR_PATROL_LEADER",
  "ASST_PATROL_LEADER",
  "PATROL_LEADER",
  "SCOUT",
  "PARENT",
  "ADULT_VOLUNTEER",
] as const;

export class Membership {
  @prop({ ref: () => Troop })
  public troopID?: Ref<Troop>;

  @prop()
  public troopNumber?: string;

  @prop({ ref: () => Patrol })
  public patrolID?: Ref<Patrol>;

  @prop({ enum: ROLES })
  public role?: string;
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

  @prop({ type: () => [Patrol] })
  public patrols?: Patrol[];

  // @prop({ ref: () => Event })
  // public events?: Ref<Event>[];
}

export const PatrolModel = getModelForClass(Patrol);
export const TroopModel = getModelForClass(Troop);
