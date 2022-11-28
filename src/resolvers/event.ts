import mongoose, { ObjectId } from 'mongoose';
import { Arg, Authorized, Float, Ctx, Int, Field, FieldResolver, ID, InputType, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Event , Point} from '../../models/Event'
import type { ContextType } from "../server";
import EventSchemas from "../Event/EventSchemas.json";
import { EventModel } from 'models/models';
import { Location, Troop } from '../../models/TroopAndPatrol'
import { Patrol } from '../../models/TroopAndPatrol';
import { User } from '../../models/User';
import { sendNotifications } from "../notifications";

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
class EventInput { 
  // since AddEventInput and UpdateEvent input are the same, combining to one class
  @Field()
  type!: string;
  @Field(type => [AddRosterInput])
  invited!: AddRosterInput[];
  @Field(type => [AddRosterInput])
  attending!: AddRosterInput[];
  @Field(type => String)
  title!: string;
  @Field(type => String)
  description: string;
  @Field(type => Date)
  date!: Date;
  @Field(type => Date)
  startTime!: Date;
  @Field(type => Date)
  meetTime: Date;
  @Field(type => Date)
  leaveTime: Date;
  @Field(type => Date)
  endTime: Date;
  @Field(type => Date)
  pickupTime: Date;
  @Field(type => String)
  uniqueMeetLocation: string;
  @Field(type => UpdateLocationInput) 
  location: any; 
  // must have this, otherwise will have type conversion errors due to trying to 
  // make updateLocationInput be a Point
  // let's discuss if we want to get rid of the point type
  @Field(type => UpdateLocationInput)
  meetLocation: any;
  @Field(type => Date)
  checkoutTime: Date;
  @Field(type => Int)
  distance: number;
  @Field(type => Boolean)
  published: boolean;
}

@InputType()
class UpdateEventInput {
  @Field()
  type: string
}

@InputType()
class UpdateLocationInput {
  // if this is the same as the imported location type, can we remove?
  @Field(type => Float)
  lat: number;
  @Field(type => Float)
  lng: number;
  @Field({nullable: true})
  address?: string;
}

@Resolver(of => Event)
export class EventResolver {
  // what is the json in resolvers??? 
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
    ).sort({ date: 1 }); 

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

  @Authorized()
  @Mutation(returns => Event)
  async addEvent(
    @Arg("input") input: EventInput,
    @Ctx() ctx: ContextType
  ): Promise<Event> {
    if (input.type === "TROOP_MEETING") {
      // odn't fully get the point of this, let's discuss
      input.title = "Troop Meeting"
    }

    // what is the difference between meetTime and startTime ?????
    let startDatetime = new Date(input?.meetTime || input?.startTime);
    const eventDate = new Date(input?.date);
	  startDatetime.setMonth(eventDate.getMonth());
		startDatetime.setDate(eventDate.getDate());
    const mutationObject = {
      ...input,
      troop: ctx.currMembership?.troopID,
      patrol: ctx.currMembership?.patrolID,
      creator: ctx.user?._id,
      // note to self double check this ;-;
      notification: new Date(startDatetime.valueOf() - 86400000) 
    };

    if (input.location) {
      mutationObject.location = {
        type: "Point",
        coordinates: [input.location.lng, input.location.lat],
        address: input.location.address
      };
    }
    if (input.meetLocation) {
      mutationObject.meetLocation = {
        type: "Point",
        coordinates: [input.meetLocation.lng, input.meetLocation.lat],
        address: input.meetLocation.address
      };
    }

    const event = await ctx.EventModel.create(mutationObject);
    sendNotifications(ctx.tokens ?? [], `${input.title} event has been created. See details.`, {
      type: "event",
      eventType: event.type,
      ID: event.id
    });
    return event;
  }

  @Authorized()
  @Mutation(returns => Event)
  async updateEvent(
    @Arg("input") input: EventInput,
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Event | null>  {
    const newVals = { ...input };
    if (input.location) {
      newVals.location = {
        type: "Point",
        coordinates: [input.location.lng, input.location.lat],
        address: input.location.address
      };
    }
    if (input.meetLocation) {
      newVals.meetLocation = {
        type: "Point",
        coordinates: [input.meetLocation.lng, input.meetLocation.lat],
        address: input.meetLocation.address
      };
    }

    await EventModel.updateOne({ _id: id }, newVals, {
      new: true
    });

    // or should we instead just create a new event if updatedEvents is null,
    // that way we don't need to return Event | null and can just return Event
    const updatedEvent = await EventModel.findById(id);

    sendNotifications(ctx.tokens ?? [], `${updatedEvent?.title} event has been updated!`, {
      type: "event",
      eventType: updatedEvent?.type ?? "",
      ID: updatedEvent?.id ?? ""
    });
    return updatedEvent;
  }

  @FieldResolver(returns => Troop)
  async troop(@Root() event: Event, @Ctx() ctx: ContextType): Promise<Troop | undefined> {
    return await ctx.TroopModel.findById(event.troop) ?? undefined;
  }

  @FieldResolver(returns => Patrol)
  async patrol(@Root() event: Event, @Ctx() ctx: ContextType): Promise<Patrol | undefined> {
    const troop = await ctx.TroopModel.findById(event.troop);
    const patrol = await troop?.patrols?.id(event.patrol);
    return patrol ?? undefined;
  }

  @FieldResolver(returns => User)
  async creator(@Root() event: Event, @Ctx() ctx: ContextType): Promise<User | undefined> {
    return await ctx.UserModel.findById(event.creator) ?? undefined;
  }
  
  @FieldResolver(returns => Location, { nullable: true })
  location(@Root() event: Event): Location | null{
    if (event.locationPoint && event.locationPoint.coordinates.length == 2) {
      return {
        lng: event.locationPoint.coordinates[0]!,
        lat: event.locationPoint.coordinates[1]!,
        address: event.locationPoint.address,
      };
    }
    return null;
  }

  @FieldResolver(returns => Location, { nullable: true })
  meetLocation(@Root() event: Event): Location | null{
    if (event.meetLocationPoint && event.meetLocationPoint.coordinates.length == 2) {
      return {
        lng: event.meetLocationPoint.coordinates[0]!,
        lat: event.meetLocationPoint.coordinates[1]!,
        address: event.meetLocationPoint.address,
      };
    }
    return null;
  }
}