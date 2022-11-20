import mongoose, { ObjectId } from 'mongoose';
import { Arg, Authorized, Ctx, Int, Field, FieldResolver, ID, InputType, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Event } from '../../models/Event'
import type { ContextType } from "../server";
import EventSchemas from "../Event/EventSchemas.json";
import { EventModel } from 'models/models';

export type EventType =
  "AQUATIC_EVENT"
  | "BACKPACK_TRIP"
  | "BIKE_RIDE"
  | "BOARD_OF_REVIEW"
  | "CAMPOUT"
  | "CANOE_TRIP"
  | "COMMITTEE_MEETING"
  | "CUSTOM_EVENT"
  | "EAGLE_PROJECT"
  | "FISHING_TRIP"
  | "FLAG_RETIREMENT"
  | "FUNDRAISER"
  | "TROOP_MEETING"
  | "HIKE"
  | "KAYAK_TRIP"
  | "MERIT_BADGE_CLASS"
  | "PARENT_MEETING"
  | "SCOUTMASTER_CONFERENCE"
  | "SERVICE_PROJECT"
  | "SPECIAL_EVENT"
  | "SUMMER_CAMP"
  | "SWIM_TEST";

export interface EventMetadata {
  eventType: EventType;
}

@InputType()
class AddRosterInput {
  @Field(type => [ID])
  id!: ObjectId[];
  @Field(type => [ID])
  patrols!: ObjectId[];
  @Field(type => [ID])
  individuals!: ObjectId[];
}

@InputType()
class AddEventInput {
  @Field()
  type!: string;
  @Field(type => [AddRosterInput])
  invited!: AddRosterInput[];
  @Field(type => [AddRosterInput])
  attending!: AddRosterInput[];
  @Field(type => String)
  title!: string;
  @Field(type => String)
  description!: string;
  @Field(type => Date)
  date!: Date;
  @Field(type => Date)
  startTime!: Date;
  @Field(type => Date)
  meetTime!: Date;
  @Field(type => Date)
  leaveTime!: Date;
  @Field(type => Date)
  endTime!: Date;
  @Field(type => Date)
  pickupTime!: Date;
  @Field(type => String)
  uniqueMeetLocation!: string;
  @Field(type => UpdateLocationInput)
  location!: UpdateLocationInput;
  @Field(type => UpdateLocationInput)
  meetLocation!: UpdateLocationInput;
  @Field(type => Date)
  checkoutTime!: Date;
  @Field(type => Int)
  distance!: number;
  @Field(type => Boolean)
  published!: boolean;
}

@InputType()
class UpdateLocationInput {
  // TODO
}

@Resolver(of => Event)
export class EventResolver {

  @Authorized()
  @Query(returns => Event)
  async event(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Event> {
    const event = await ctx.EventModel.findById(id);
    if (!event) {
      throw new Error("Event could not be found");
    }
    return event;
  }

  @Authorized()
  @Query(returns => [Event])
  async events(
    @Arg("first", type => Int, { nullable: true }) first: number,
    @Arg("skip", type => Int, { nullable: true }) skip: number,
    @Ctx() ctx: ContextType,
  ): Promise<Event[]> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (myTroop === null) {
      throw new Error("Selected troop does not exist");
    }

    const events = await ctx.EventModel.find(
      {
        date: {
          $gte: new Date(Date.now() - 86400000 * 1.5),
          $lte: new Date(Date.now() + 6.04e8 * 10),
        },
        troop: myTroop,
      },
      null,
      {
        first,
        skip,
      }
    ); // need to add / figure the date part out >> .sort({ date: 1 });

    return events;
  }

  @Query(returns => JSON)
  eventSchemas(): any {
    // TODO: fix return type once jaron is done correcting the type
    return EventSchemas;
  }

  @Authorized()
  @Mutation(returns => ID)
  async deleteEvent(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Event | null> {
    // TODO: double check `id` parameter type and Promise return type
    return await ctx.EventModel.findByIdAndDelete(id);
  }

  // @Authorized()
  // @Mutation(returns => Event)
  // async addEvent(
  //   input: AddEventInput
  // ): Promise<Event> {

  // }
}