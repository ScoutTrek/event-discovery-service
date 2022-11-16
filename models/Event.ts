import { prop as Property } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

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

registerEnumType(EVENT_TYPE, {
  name: "EventType",
});

export class Point {
  @Property({ required: true, enum: ["Point"] as const })
  public type!: string;

  @Property({ required: true, type: () => [Number] })
  public coordinates!: number[];

  @Property()
  public address?: string;
}

export class MessageUser {
  @Property({ required: true })
  public name!: string;
}

export class Message {
  @Property()
  public text?: string;

  @Property()
  public image?: string;

  @Property({ default: Date.now })
  public createdAt?: Date;

  @Property()
  public user?: MessageUser;
}

@ObjectType()
export class Event {
  @Field(type => ID, {name: "id"})
  readonly _id: mongoose.Types.ObjectId;

  @Field(type => EVENT_TYPE)
  @Property({ required: true, enum: EVENT_TYPE })
  public type!: EVENT_TYPE;

  @Field(type => Troop)
  @Property({ required: true, ref: () => Troop })
  public troop!: Ref<Troop, mongoose.Types.ObjectId>;

  @Field(type => Patrol)
  @Property({ required: true, ref: () => Patrol })
  public patrol!: Ref<Patrol, mongoose.Types.ObjectId>;

  @Field()
  @Property({ required: [true, "An event cannot have a blank title."] })
  public title!: string;

  @Field({ nullable: true })
  @Property()
  public description?: string;

  @Field()
  @Property({ required: true })
  public date!: Date;

  @Field()
  @Property({ required: true })
  public startTime?: Date;

  @Field({ nullable: true })
  @Property()
  public uniqueMeetLocation?: string;

  @Field({ nullable: true })
  @Property()
  public meetTime?: Date;

  @Field({ nullable: true })
  @Property()
  public leaveTime?: Date;

  @Field({ nullable: true })
  @Property()
  public pickupTime?: Date;

  @Field({ nullable: true })
  @Property()
  public endTime?: Date;

  @Property()
  public locationPoint?: Point;

  @Property()
  public meetLocationPoint?: Point;

  @Property({ required: true, type: () => [Message], default: [] })
  public messages!: Message[];

  @Field(type => Roster)
  @Property({ required: true, default: {groups: [], patrols: [], individuals: []} })
  public invited!: Roster;

  @Field(type => Roster)
  @Property({ required: true, default: {groups: [], patrols: [], individuals: []}})
  public attending!: Roster;

  @Property({ enum: DAYS_OF_WEEK })
  public day?: string;

  @Field({ nullable: true })
  @Property()
  public distance?: number;

  @Property()
  public shakedown?: boolean;

  @Property()
  public published?: boolean;

  @Field(type => User, { nullable: true })
  @Property({ ref: () => User })
  public creator?: Ref<User, mongoose.Types.ObjectId>;

  @Property()
  public notification?: Date;

  @Field({nullable: true})
  createdAt?: string;

  @Field({nullable: true})
  updatedAt?: string;

  /**
   * TODO:
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