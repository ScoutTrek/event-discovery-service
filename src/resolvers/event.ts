import { GraphQLError, GraphQLScalarType } from 'graphql';
import mongoose from 'mongoose';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';

import { Event, EVENT_TYPE } from '../../models/Event';
import { Roster } from '../../models/Roster';
import { Location, Patrol, Troop } from '../../models/TroopAndPatrol';
import { User } from '../../models/User';
import EventSchemas from '../Event/EventSchemas.json';
import { sendNotifications } from '../notifications';
import { getDocument, getDocuments } from '../utils/mongoose';

import type { ContextType } from '../context';
import { Ref } from '@typegoose/typegoose';

@InputType()
class AddRosterInput {
  @Field(type => [ID])
  yes!: mongoose.Types.ObjectId[];
  @Field(type => [ID])
  no!: mongoose.Types.ObjectId[];
  @Field(type => [ID])
  maybe!: mongoose.Types.ObjectId[];
}

@InputType()
class UpdateLocationInput {
  // if this is the same as the imported location type, can we remove?
  @Field(type => Float)
  lat: number;
  @Field(type => Float)
  lng: number;
  @Field({ nullable: true })
  address?: string;
}

@InputType()
class AddEventInput {
  @Field(type => EVENT_TYPE)
  type!: EVENT_TYPE;
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  description?: string;
  @Field(type => Date, { nullable: true })
  date?: Date;
  @Field({ nullable: true })
  startTime?: string;
  @Field(type => Date, { nullable: true })
  meetTime?: Date;
  @Field(type => Date, { nullable: true })
  leaveTime?: Date;
  @Field({ nullable: true })
  endTime?: string;
  @Field(type => Date, { nullable: true })
  endDate?: Date;
  @Field(type => Date, { nullable: true })
  pickupTime?: Date;
  @Field({ nullable: true })
  uniqueMeetLocation?: string;
  @Field(type => UpdateLocationInput, { nullable: true })
  location?: UpdateLocationInput;
  @Field(type => UpdateLocationInput, { nullable: true })
  meetLocation?: UpdateLocationInput;
  @Field(type => Date, { nullable: true })
  checkoutTime?: Date;
  @Field(type => Int, { nullable: true })
  distance?: number;
  @Field(type => Boolean, { nullable: true })
  published?: boolean;
}

@InputType()
class UpdateEventInput {
  @Field(type => ID, { nullable: true })
  creator?: mongoose.Types.ObjectId;
  @Field(type => EVENT_TYPE, { nullable: true })
  type?: EVENT_TYPE;
  @Field(type => AddRosterInput, { nullable: true })
  attending?: AddRosterInput;
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  description?: string;
  @Field(type => Date, { nullable: true })
  date?: Date;
  @Field({ nullable: true })
  startTime?: string;
  @Field(type => Date, { nullable: true })
  meetTime?: Date;
  @Field(type => Date, { nullable: true })
  leaveTime?: Date;
  @Field({ nullable: true })
  endTime?: string;
  @Field(type => Date, { nullable: true })
  endDate?: Date;
  @Field(type => Date, { nullable: true })
  pickupTime?: Date;
  @Field({ nullable: true })
  uniqueMeetLocation?: string;
  @Field(type => UpdateLocationInput, { nullable: true })
  location?: UpdateLocationInput;
  @Field(type => UpdateLocationInput, { nullable: true })
  meetLocation?: UpdateLocationInput;
  @Field(type => Date, { nullable: true })
  checkoutTime?: Date;
  @Field(type => Int, { nullable: true })
  distance?: number;
  @Field(type => Boolean, { nullable: true })
  published?: boolean;
}

// custom scalar type so that we can query for event schemas without throwing an error
// this is the barest of bare-bone implementations but it works
const EventSchemaScalar = new GraphQLScalarType({
  name: 'EventSchemaType',
  description: 'scalar for event schema',
  serialize(value: Object) {
    return value;
  },
  parseValue(value: Object) {
    return value;
  },
  parseLiteral(value) {
    return value;
  },
});

@Resolver(of => Event)
export class EventResolver {
  // what is the json in resolvers???
  @Authorized()
  @Query(returns => Event)
  async event(
    @Arg('id', type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Event> {
    const event = await ctx.EventModel.findById(id);
    if (!event) {
      throw new Error('Event could not be found');
    }
    return event;
  }

  @Authorized()
  @Query(returns => [Event])
  async events(
    @Arg('first', type => Int, { nullable: true }) first: number,
    @Arg('skip', type => Int, { nullable: true }) skip: number,
    @Ctx() ctx: ContextType
  ): Promise<Event[]> {
    if (ctx.currMembership === undefined) {
      throw new Error('No membership selected!');
    }
    const myTroop = await ctx.TroopModel.findById(
      ctx.currMembership.troopID._id
    );
    if (myTroop === null) {
      throw new Error('Selected troop does not exist');
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

  @Query(returns => EventSchemaScalar)
  eventSchemas(): Object {
    // TODO: fix return type once jaron is done correcting the type
    return EventSchemas;
  }

  @Authorized()
  @Mutation(returns => Boolean)
  async deleteEvent(
    @Arg('id', type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<boolean> {
    await ctx.EventModel.findByIdAndDelete(id);
    return true;
  }

  @Authorized()
  @Mutation(returns => Boolean)
  async rsvp(
    @Arg('event_id', type => ID) eventID: string,
    @Arg('response', type => Number) response: number,
    @Ctx() ctx: ContextType
  ): Promise<boolean> {
    if (ctx.currMembership === undefined) {
      throw new Error('No membership selected!');
    }
    const myTroop = await ctx.TroopModel.findById(
      ctx.currMembership.troopID._id
    );
    if (myTroop === null) {
      throw new Error('Selected troop does not exist');
    }

    const event = await ctx.EventModel.findById(eventID);
    if (!event) {
      throw new Error('Event does not exist');
    }

    if (!event.troop._id.equals(myTroop._id)) {
      throw new GraphQLError('Forbidden', {
        extensions: {
          code: 'FORBIDDEN',
        },
      });
    }

    const userID = ctx.user!._id;
    if (response === 0)
      await ctx.EventModel.updateOne(
        { _id: eventID },
        {
          $pull: { 'roster.yes': userID, 'roster.maybe': userID },
          $addToSet: { 'roster.no': userID },
        }
      );
    else if (response === 1)
      await ctx.EventModel.updateOne(
        { _id: eventID },
        {
          $pull: { 'roster.no': userID, 'roster.maybe': userID },
          $addToSet: { 'roster.yes': userID },
        }
      );
    else if (response === 2)
      await ctx.EventModel.updateOne(
        { _id: eventID },
        {
          $pull: { 'roster.yes': userID, 'roster.no': userID },
          $addToSet: { 'roster.maybe': userID },
        }
      );
    else
      throw new GraphQLError('Invalid RSVP', {
        extensions: {
          code: 'BAD_REQUEST',
        },
      });

    return true;
  }

  @Authorized()
  @Mutation(returns => Event)
  async addEvent(
    @Arg('input') input: AddEventInput,
    @Ctx() ctx: ContextType
  ): Promise<Event> {
    if (ctx.currMembership === undefined) {
      throw new Error('No membership selected!');
    }

    if (input.type === 'TROOP_MEETING') {
      input.title = 'Troop Meeting';
    }

    // what is the difference between meetTime and startTime ?????
    const startTime = input?.meetTime || input?.startTime;
    let startDatetime = new Date(startTime ?? Date.now());
    const eventDate = new Date(input?.date ?? Date.now());
    startDatetime.setMonth(eventDate.getMonth());
    startDatetime.setDate(eventDate.getDate());

    const { location, meetLocation, ...restInput } = input;
    const mutationObject: Partial<Event> = {
      ...restInput,
      troop: ctx.currMembership.troopID,
      patrol: ctx.currMembership.patrolID,
      creator: ctx.user!._id,
      notification: new Date(startDatetime.valueOf() - 86400000),
    };

    if (location) {
      mutationObject.locationPoint = {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: location.address,
      };
    }
    if (meetLocation) {
      mutationObject.meetLocationPoint = {
        type: 'Point',
        coordinates: [meetLocation.lng, meetLocation.lat],
        address: meetLocation.address,
      };
    }

    const event = await ctx.EventModel.create(mutationObject);
    sendNotifications(
      ctx.tokens ?? [],
      `${input.title} event has been created. See details.`,
      {
        type: 'event',
        eventType: event.type,
        ID: event.id,
      }
    );
    return event;
  }

  @Authorized()
  @Mutation(returns => Event)
  async updateEvent(
    @Arg('input') input: UpdateEventInput,
    @Arg('id', type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Event | null> {
    const { location, meetLocation, ...restInput } = input;
    const newVals: Partial<Event> = { ...restInput };
    if (location) {
      newVals.locationPoint = {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: location.address,
      };
    }
    if (meetLocation) {
      newVals.meetLocationPoint = {
        type: 'Point',
        coordinates: [meetLocation.lng, meetLocation.lat],
        address: meetLocation.address,
      };
    }
    await ctx.EventModel.updateOne({ _id: id }, newVals);

    const updatedEvent = await ctx.EventModel.findById(id);

    sendNotifications(
      ctx.tokens ?? [],
      `${updatedEvent?.title} event has been updated!`,
      {
        type: 'event',
        eventType: updatedEvent?.type ?? '',
        ID: updatedEvent?.id ?? '',
      }
    );
    return updatedEvent;
  }

  @FieldResolver(returns => Troop)
  async troop(
    @Root() event: Event,
    @Ctx() ctx: ContextType
  ): Promise<Troop | undefined> {
    return (await ctx.TroopModel.findById(event.troop._id)) ?? undefined;
  }

  @FieldResolver(returns => Patrol)
  async patrol(
    @Root() event: Event,
    @Ctx() ctx: ContextType
  ): Promise<Patrol | undefined> {
    const troop = await ctx.TroopModel.findById(event.troop._id);
    const patrol = await troop?.patrols?.id(event.patrol);
    return patrol ?? undefined;
  }

  @FieldResolver(returns => User)
  async creator(
    @Root() event: Event,
    @Ctx() ctx: ContextType
  ): Promise<User | undefined> {
    return (await ctx.UserModel.findById(event.creator?._id)) ?? undefined;
  }

  @FieldResolver(returns => Location, { nullable: true })
  location(@Root() event: Event): Location | null {
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
  meetLocation(@Root() event: Event): Location | null {
    if (
      event.meetLocationPoint &&
      event.meetLocationPoint.coordinates.length == 2
    ) {
      return {
        lng: event.meetLocationPoint.coordinates[0]!,
        lat: event.meetLocationPoint.coordinates[1]!,
        address: event.meetLocationPoint.address,
      };
    }
    return null;
  }
}

@Resolver(of => Roster)
export class RosterResolver {
  @FieldResolver(returns => [User])
  async yes(@Root() roster: Roster, @Ctx() ctx: ContextType): Promise<User[]> {
    const event = await ctx.EventModel.findById(roster.eventId);
    if (!event) {
      throw new GraphQLError('No such event', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }
    return getDocuments((await event.populate('roster.yes')).roster.yes);
  }

  @FieldResolver(returns => [User])
  async no(@Root() roster: Roster, @Ctx() ctx: ContextType): Promise<User[]> {
    const event = await ctx.EventModel.findById(roster.eventId);
    if (!event) {
      throw new GraphQLError('No such event', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }
    return getDocuments((await event.populate('roster.no')).roster.no);
  }

  @FieldResolver(returns => [User])
  async maybe(
    @Root() roster: Roster,
    @Ctx() ctx: ContextType
  ): Promise<User[]> {
    const event = await ctx.EventModel.findById(roster.eventId);
    if (!event) {
      throw new GraphQLError('No such event', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }
    return getDocuments((await event.populate('roster.maybe')).roster.maybe);
  }

  @FieldResolver(returns => [User])
  async noResponse(
    @Root() roster: Roster,
    @Ctx() ctx: ContextType
  ): Promise<User[]> {
    const event = await ctx.EventModel.findById(roster.eventId);
    if (!event) {
      throw new GraphQLError('No such event', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }
    await event.populate('troop');
    const troop = getDocument(event.troop);
    const invited = new Set(
      troop.patrols.flatMap(p => p.members.map(u => u._id.toString()))
    );
    const responded = new Set(
      roster.yes
        .concat(roster.no)
        .concat(roster.maybe)
        .map(u => u._id.toString())
    );
    const notResponded = [...invited].filter(u => !responded.has(u));
    return await ctx.UserModel.find({ _id: { $in: notResponded } });
  }
}
