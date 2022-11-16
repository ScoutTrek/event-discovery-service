import { modelOptions, prop } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, Float, ID, ObjectType, registerEnumType } from 'type-graphql';

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
class Location {
  @Field(type => Float)
  lat: number;
  @Field(type => Float)
  lng: number;
  @Field({nullable: true})
  address: string;
}

@ObjectType()
export class Membership {
  @Field(type => ID, {name: "id"})
  readonly _id: mongoose.Types.ObjectId;

  @Field(type => ID)
  @prop({ required: true, ref: () => Troop })
  public troopID!: Ref<Troop, mongoose.Types.ObjectId>;

  @Field(type => ID)
  @prop({ required: true })
  public troopNumber!: string;

  @Field(type => ID)
  @prop({ required: true, ref: () => Patrol })
  public patrolID!: Ref<Patrol, mongoose.Types.ObjectId>;

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
  readonly _id: mongoose.Types.ObjectId;

  @Field()
  @prop({ required: true })
  public name!: string;

  @Field(type => [User])
  @prop({ required: true, ref: () => User, default: [] })
  public members!: Ref<User, mongoose.Types.ObjectId>[];

  @Field(type => [Event])
  @prop({ required: true, ref: () => Event, default: [] })
  public events!: Ref<Event, mongoose.Types.ObjectId>[];
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
  readonly _id: mongoose.Types.ObjectId;
  
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

  @Field(type => User, {nullable: true})
  @prop({ref: () => User})
  public scoutMaster?: Ref<User, mongoose.Types.ObjectId>;

  @Field(type => Location, {nullable: true})
  @prop()
  public meetLocation?: Point;

  @Field(type => [Patrol])
  @prop({ required: true, type: () => [Patrol], default: [] })
  public patrols!: mongoose.Types.DocumentArray<ArraySubDocumentType<Patrol>>;

  // @Field(type => [Event])
  @prop({ ref: () => Event })
  public events?: Ref<Event, mongoose.Types.ObjectId>[];
}
