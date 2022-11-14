import { modelOptions, prop } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

import { Event, Point } from './Event';
import { User } from './User';

import type { Ref, ArraySubDocumentType } from '@typegoose/typegoose';

export enum ROLE {
  SCOUTMASTER = "SCOUTMASTER",
  ASST_SCOUTMASTER = "ASST_SCOUTMASTER",
  SENIOR_PATROL_LEADER = "SENIOR_PATROL_LEADER",
  ASST_PATROL_LEADER = "ASST_PATROL_LEADER",
  PATROL_LEADER = "PATROL_LEADER",
  SCOUT = "SCOUT",
  PARENT = "PARENT",
  ADULT_VOLUNTEER = "ADULT_VOLUNTEER",
}

registerEnumType(ROLE, {
  name: "Role",
  description: "A user's role within a patrol"
});

@ObjectType()
export class Membership {
  @Field(type => ID, {name: "id"})
  readonly _id: ObjectId;

  @Field(type => ID)
  @prop({ required: true, ref: () => Troop })
  public troopID!: Ref<Troop>;

  @Field(type => ID)
  @prop({ required: true })
  public troopNumber!: string;

  @Field(type => ID)
  @prop({ required: true, ref: () => Patrol })
  public patrolID!: Ref<Patrol>;

  @Field(type => ROLE)
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
@ObjectType()
export class Patrol {
  @Field(type => ID, {name: "id"})
  readonly _id: ObjectId;

  @Field()
  @prop({ required: true })
  public name!: string;

  @Field(type => [User])
  @prop({ required: true, ref: () => User, default: [] })
  public members!: Ref<User>[];

  @Field(type => [Event])
  @prop({ required: true, ref: () => Event, default: [] })
  public events!: Ref<Event>[];
}

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
})
@ObjectType()
export class Troop {
  @Field(type => ID, {name: "id"})
  readonly _id: ObjectId;
  
  @Field()
  @prop({ required: true })
  public council!: string;

  @Field()
  @prop({ required: true })
  public state!: string;

  @Field()
  @prop({ required: true })
  public unitNumber!: number;

  @Field()
  @prop({ required: true })
  public city: string;

  @Field({nullable: true})
  @prop()
  public scoutMaster?: string;

  @Field({nullable: true})
  @prop()
  public meetLocation?: Point;

  @Field()
  @prop({ required: true, type: () => [Patrol], default: [] })
  public patrols!: mongoose.Types.DocumentArray<ArraySubDocumentType<Patrol>>;

  @prop({ ref: () => Event })
  public events?: Ref<Event>[];
}
