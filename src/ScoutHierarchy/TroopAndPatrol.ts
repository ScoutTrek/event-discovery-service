import mongoose from 'mongoose';
import { Arg, Authorized, Ctx, Field, FieldResolver, ID, InputType, Int, Mutation, Query, Resolver, Root } from 'type-graphql';

import { Patrol, ROLE, Troop } from '../../models/TroopAndPatrol';
import { User } from '../../models/User';

import type { ContextType } from '../server';
import type { DocumentType } from '@typegoose/typegoose';

@InputType()
class AddTroopInput implements Partial<Troop> {
  @Field()
  council!: string;
  @Field()
  state!: string;
  @Field(type => Int, {nullable: true})
  unitNumber!: number;
  @Field({nullable: true})
  city?: string;
  @Field(type => ID, {nullable: true})
  scoutMaster?: mongoose.Types.ObjectId;
  // @Field()
  // meetLocation?: AddLocationInput
  // @Field(type => [ID], {nullable: true, name: "patrols"})
  // patrolIds?: mongoose.Types.ObjectId[];
  // @Field(type => [ID], {nullable: true, name: "events"})
  // eventIds?: mongoose.Types.ObjectId[];
}

@InputType()
class UpdateTroopInput implements Partial<Troop> {
  @Field({nullable: true})
  council?: string;
  @Field({nullable: true})
  state?: string;
  @Field(type => Int, {nullable: true})
  unitNumber?: number;
  @Field({nullable: true})
  city?: string;
  @Field(type => ID, {nullable: true})
  scoutMaster?: mongoose.Types.ObjectId;
  // @Field()
  // meetLocation?: AddLocationInput
  @Field(type => [ID], {nullable: true, name: "patrols"})
  patrolIds?: mongoose.Types.ObjectId[];
  @Field(type => [ID], {nullable: true})
  eventIds?: mongoose.Types.ObjectId[];
}

@InputType()
class AddPatrolInput implements Partial<Patrol> {
  @Field()
  name: string;
  @Field(type => [ID], {nullable: true})
  members?: mongoose.Types.ObjectId[];
  @Field(type => [ID], {nullable: true})
  events?: mongoose.Types.ObjectId[];
}

@InputType()
class UpdatePatrolInput implements Partial<Patrol> {
  @Field({nullable: true})
  name?: string;
  @Field(type => [ID], {nullable: true})
  members?: mongoose.Types.ObjectId[];
  @Field(type => [ID], {nullable: true})
  events?: mongoose.Types.ObjectId[];
}

@Resolver(of => Troop)
export class TroopResolver {
  @Query(returns => [Troop])
  async troops(
    @Arg("limit", type => Int, {nullable: true}) limit: number,
    @Arg("skip", type => Int, {nullable: true}) skip: number,
    @Ctx() ctx: ContextType
  ): Promise<Troop[]> {
    return await ctx.TroopModel.find({}, null, { limit, skip })
  }

  @Query(returns => Troop)
  async troop(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Troop | null> {
    return await ctx.TroopModel.findById(id);
  }

  @Authorized()
  @Query(returns => Troop)
  async currTroop(
    @Ctx() ctx: ContextType
  ): Promise<Troop | null> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    return await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
  }

  @Authorized()
  @Mutation(returns => Troop)
  async addTroop(
    @Arg("input") input: AddTroopInput,
    @Ctx() ctx: ContextType
  ): Promise<Troop> {
    return await ctx.TroopModel.create(input);
  }

  // TODO: The following were missing from the existing resolvers?
  // @Mutation()
  // async updateTroop(
  //   @Arg("id", type => ID) id: mongoose.Types.ObjectId,
  //   @Arg("input") input: UpdateTroopInput,
  //   @Ctx() ctx: ContextType
  // ): Promise<Troop> {

  // }

  // @Mutation()
  // updateCurrTroop(
  //   @Arg("input") input: UpdateTroopInput,
  //   @Ctx() ctx: ContextType
  // ): Troop {
    
  // }

  // @Mutation()
  // deleteTroop(
  //   @Arg("id", type => ID) id: mongoose.Types.ObjectId,
  //   @Ctx() ctx: ContextType
  // ): Troop {
    
  // }

  // @Mutation()
  // deleteCurrTroop(@Ctx() ctx: ContextType): Troop {
    
  // }
}

@Resolver(of => Patrol)
export class PatrolResolver {
  @Authorized()
  @Query(returns => [Patrol])
  async patrols(
    @Ctx() ctx: ContextType
  ): Promise<Patrol[]> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (myTroop === null) {
      throw new Error("Selected troop does not exist");
    }
    return myTroop.patrols;
  }

  @Query(returns => [Patrol])
  async patrolsOfTroop(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Patrol[]> {
    const myTroop = await ctx.TroopModel.findById(id);
    if (myTroop === null) {
      throw new Error("Selected troop does not exist");
    }
    return myTroop.patrols;
  }

  @Authorized()
  @Query(returns => Patrol)
  async patrol(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<Patrol | null> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (myTroop === null) {
      throw new Error("Selected troop does not exist");
    }
    return myTroop.patrols.id(id);
  }

  @Authorized()
  @Query(returns => Patrol)
  async currPatrol(
    @Ctx() ctx: ContextType
  ): Promise<Patrol | null> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (myTroop === null) {
      throw new Error("Selected troop does not exist");
    }
    return myTroop.patrols.id(ctx.currMembership.patrolID._id);
  }

  // Will need to figure out how to create a Troop and a Patrol at the same time.
  @Mutation(returns => Patrol)
  async addPatrol(
    @Arg("troopId", type => ID) troopId: mongoose.Types.ObjectId,
    @Arg("input") input: AddPatrolInput,
    @Ctx() ctx: ContextType
  ): Promise<Patrol> {
    const troop = await ctx.TroopModel.findById(troopId);
    if (troop == null) {
      throw new Error("Troop does not exist");
    }
    troop.patrols.push(input);

    troop.save(function (err) {
      if (err) return new Error(err.message);
    });

    return troop.patrols[troop.patrols.length - 1]!;
  }

  @Authorized([ROLE.PATROL_LEADER])
  @Mutation(returns => Patrol)
  async updatePatrol(
    @Arg("id", type => ID) id: mongoose.Types.ObjectId,
    @Arg("input") input: UpdatePatrolInput,
    @Ctx() ctx: ContextType
  ): Promise<Patrol> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const troop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (troop === null) {
      throw new Error("Selected troop does not exist");
    }
    const patrol = troop.patrols.id(id);
    if (patrol === null) {
      throw new Error("Patrol does not exist");
    }
    const updatedPatrol = { ...patrol, ...input };
    patrol.set(updatedPatrol);
    await troop.save();
    return patrol;
  }

  @Authorized()
  @Mutation(returns => Patrol)
  async updateCurrPatrol(
    @Arg("input") input: UpdatePatrolInput,
    @Ctx() ctx: ContextType
  ): Promise<Patrol> {
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const troop = await ctx.TroopModel.findById(ctx.currMembership.troopID._id);
    if (troop === null) {
      throw new Error("Selected troop does not exist");
    }
    const patrol = troop.patrols.id(ctx.currMembership.patrolID._id);
    if (patrol === null) {
      throw new Error("Patrol does not exist");
    }
    const updatedPatrol = { ...patrol, ...input };
    patrol.set(updatedPatrol);
    await troop.save();
    return patrol;
  }

  @Authorized([ROLE.PATROL_LEADER])
  @Mutation(returns => Patrol)
  async deletePatrol(
    @Arg("id", type => ID) id: mongoose.Types.ObjectId,
    @Ctx() ctx: ContextType
  ): Promise<Patrol> {
    // Not tested because I don't have very much data in the DB yet.
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const troop = await ctx.TroopModel.findById(ctx.currMembership.troopID);
    if (troop === null) {
      throw new Error("Selected troop does not exist");
    }
    const patrol = troop.patrols.id(id);
    if (patrol === null) {
      throw new Error("Patrol does not exist");
    }
    return await patrol.remove();
  }

  @Authorized([ROLE.PATROL_LEADER])
  @Mutation(returns => Patrol)
  async deleteCurrPatrol(@Ctx() ctx: ContextType): Promise<Patrol> {
    // Not tested because I don't have very much data in the DB yet.
    if (ctx.currMembership === undefined) {
      throw new Error("No membership selected!");
    }
    const troop = await ctx.TroopModel.findById(ctx.currMembership.troopID);
    if (troop === null) {
      throw new Error("Selected troop does not exist");
    }
    const patrol = troop.patrols.id(ctx.currMembership.patrolID);
    if (patrol === null) {
      throw new Error("Patrol does not exist");
    }
    return await patrol.remove();
  }

  @Authorized()
  @FieldResolver(returns => Troop)
  async troop(@Ctx() ctx: ContextType): Promise<Troop | undefined> {
    if (ctx.currMembership) {
      return await ctx.TroopModel.findById(ctx.currMembership.troopID._id) ?? undefined;
    }
  }

  @FieldResolver(returns => [User])
  async members(@Root() patrol: DocumentType<Patrol>, @Ctx() ctx: ContextType): Promise<User[]> {
    const members = await ctx.UserModel.find().where("_id").in(patrol.members.map(m => m._id));
    return members;
  }

  // @FieldResolver(returns => [Event])
  // async events(@Root() patrol: DocumentType<Patrol>): Promise<Event[]> {
  //   const events = await ctx.EventModel.find().where("_id").in(parent.events.map(e => e._id));
  //   return events;
  // }
}
