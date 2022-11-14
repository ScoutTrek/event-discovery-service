import { prop } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';

import { Roster } from './Roster';
import { Patrol, Troop } from './TroopAndPatrol';
import { User } from './User';

import type { Ref } from "@typegoose/typegoose";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export enum EVENT_TYPE {
  AQUATIC_EVENT = "AQUATIC_EVENT",
  BACKPACK_TRIP = "BACKPACK_TRIP",
  BIKE_RIDE = "BIKE_RIDE",
  BOARD_OF_REVIEW = "BOARD_OF_REVIEW",
  CAMPOUT = "CAMPOUT",
  CANOE_TRIP = "CANOE_TRIP",
  COMMITTEE_MEETING = "COMMITTEE_MEETING",
  CUSTOM_EVENT = "CUSTOM_EVENT",
  EAGLE_PROJECT = "EAGLE_PROJECT",
  FISHING_TRIP = "FISHING_TRIP",
  FLAG_RETIREMENT = "FLAG_RETIREMENT",
  FUNDRAISER = "FUNDRAISER",
  TROOP_MEETING = "TROOP_MEETING",
  HIKE = "HIKE",
  KAYAK_TRIP = "KAYAK_TRIP",
  MERIT_BADGE_CLASS = "MERIT_BADGE_CLASS",
  PARENT_MEETING = "PARENT_MEETING",
  SCOUTMASTER_CONFERENCE = "SCOUTMASTER_CONFERENCE",
  SERVICE_PROJECT = "SERVICE_PROJECT",
  SPECIAL_EVENT = "SPECIAL_EVENT",
  SUMMER_CAMP = "SUMMER_CAMP",
  SWIM_TEST = "SWIM_TEST",
}

export class Point {
  @prop({ required: true, enum: ["Point"] as const })
  public type!: string;

  @prop({ required: true, type: () => [Number] })
  public coordinates!: number[];

  @prop()
  public address?: string;
}

export class MessageUser {
  @prop({ required: true })
  public name!: string;
}

export class Message {
  @prop()
  public text?: string;

  @prop()
  public image?: string;

  @prop({ default: Date.now })
  public createdAt?: Date;

  @prop()
  public user?: MessageUser;
}

@ObjectType()
export class Event {
  @Field(type => ID, {name: "id"})
  readonly _id: ObjectId;

  @Field(type => EVENT_TYPE)
  @prop({ required: true, enum: EVENT_TYPE })
  public type!: EVENT_TYPE;

  @Field(type => Troop)
  @prop({ required: true, ref: () => Troop })
  public troop!: Ref<Troop>;

  @Field(type => Patrol)
  @prop({ required: true, ref: () => Patrol })
  public patrol!: Ref<Patrol>;

  @Field()
  @prop({ required: [true, "An event cannot have a blank title."] })
  public title!: string;

  @Field({ nullable: true })
  @prop()
  public description?: string;

  @Field()
  @prop({ required: true })
  public date!: Date;

  @Field()
  @prop({ required: true })
  public startTime?: Date;

  @Field({ nullable: true })
  @prop()
  public uniqueMeetLocation?: string;

  @Field({ nullable: true })
  @prop()
  public meetTime?: Date;

  @Field({ nullable: true })
  @prop()
  public leaveTime?: Date;

  @Field({ nullable: true })
  @prop()
  public pickupTime?: Date;

  @Field({ nullable: true })
  @prop()
  public endTime?: Date;

  @prop()
  public locationPoint?: Point;

  @prop()
  public meetLocationPoint?: Point;

  @prop({ required: true, type: () => [Message], default: [] })
  public messages!: Message[];

  @Field(type => Roster)
  @prop({ required: true, default: {groups: [], patrols: [], individuals: []} })
  public invited!: Roster;

  @Field(type => Roster)
  @prop({ required: true, default: {groups: [], patrols: [], individuals: []}})
  public attending!: Roster;

  @prop({ enum: DAYS_OF_WEEK })
  public day?: string;

  @Field({ nullable: true })
  @prop()
  public distance?: number;

  @prop()
  public shakedown?: boolean;

  @prop()
  public published?: boolean;

  @Field(type => User, { nullable: true })
  @prop({ ref: () => User })
  public creator?: Ref<User>;

  @prop()
  public notification?: Date;

  @Field({nullable: true})
  createdAt?: string;

  @Field({nullable: true})
  updatedAt?: string;

  /**
   * TODO
   */
  public get time(): string {
    let date = new Date(this.date ?? Date.now());
    const formattedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return formattedDate;
  }
}

// type Location {
//   lat: Float!
//   lng: Float!
//   address: String
// }