import mongoose from 'mongoose';
import { Arg, Authorized, Ctx, Int, Field, FieldResolver, ID, InputType, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Event } from '../../models/Event'
import type { ContextType } from "../server";

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
      throw new Error("User could not be found")
    }
    return event;
  }

  @Authorized()
  @Query(returns => [Event])
  async events(
    @Arg("first", type => Int, {nullable: true}) first: number,
    @Arg("skip", type => Int, {nullable: true}) skip: number,
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
}