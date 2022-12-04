import { User } from 'models/User';
import mongoose from 'mongoose';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { Location, Troop } from '../../models/TroopAndPatrol';
import type { ContextType } from '../context';

// note: some resolvers in the old backend (such as updating troops) weren't implemented, hence why
// we have a lot of code commented out in this file. these may be worth looking into/implementing later.

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

// @InputType()
// class UpdateTroopInput implements Partial<Troop> {
//   @Field({nullable: true})
//   council?: string;
//   @Field({nullable: true})
//   state?: string;
//   @Field(type => Int, {nullable: true})
//   unitNumber?: number;
//   @Field({nullable: true})
//   city?: string;
//   @Field(type => ID, {nullable: true})
//   scoutMaster?: mongoose.Types.ObjectId;
//   // @Field()
//   // meetLocation?: AddLocationInput
//   @Field(type => [ID], {nullable: true, name: "patrols"})
//   patrolIds?: mongoose.Types.ObjectId[];
//   @Field(type => [ID], {nullable: true})
//   eventIds?: mongoose.Types.ObjectId[];
// }

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
    return await ctx.TroopModel.findById(ctx.currMembership.troop._id);
  }

  @Authorized()
  @Mutation(returns => Troop)
  async addTroop(
    @Arg("input") input: AddTroopInput,
    @Ctx() ctx: ContextType
  ): Promise<Troop> {
    return await ctx.TroopModel.create(input);
  }

  @FieldResolver(returns => Location)
  meetLocation(@Root() troop: Troop, @Ctx() ctx: ContextType): Location | null {
    if (troop.meetLocation && troop.meetLocation.coordinates.length == 2) {
      return {
        lng: troop.meetLocation.coordinates[0]!,
        lat: troop.meetLocation.coordinates[1]!,
        address: troop.meetLocation.address,
      };
    }
    return null;
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

  @FieldResolver()
  async scoutMaster(@Root() troop: Troop, @Ctx() ctx: ContextType): Promise<User | null> {
    return await ctx.UserModel.findById(troop.scoutMaster?._id);
  }
}
