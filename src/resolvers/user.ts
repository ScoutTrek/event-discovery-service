import mongoose, { Error } from 'mongoose';
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
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';

import { Membership, Patrol, ROLE, Troop } from '../../models/TroopAndPatrol';
import { User } from '../../models/User';

import type { ContextType } from '../context';

@InputType()
class AddMembershipInput implements Partial<Membership>{
  @Field(type => ID)
  troopID!: mongoose.Types.ObjectId;

  @Field(type => ID)
  troopNumber!: string;

  @Field(type => ID)
  patrolID!: mongoose.Types.ObjectId;

  @Field(type => ROLE)
  role!: ROLE;

  @Field(type => [String], {nullable: true})
  children?: string[];
}

@ObjectType()
class MembershipPayload implements Partial<Membership> {
  @Field(type => ID)
  groupID: mongoose.Types.ObjectId;
  @Field()
  troopNumber: string;
}

@InputType()
class UpdateUserInput { // implements Partial<User>
  @Field({nullable: true})
  name?: string;
  @Field({nullable: true})
  email?: string;
  @Field({nullable: true})
  expoNotificationToken?: string;
  @Field({nullable: true})
  password?: string;
  @Field({nullable: true})
  phone?: string;
  @Field({nullable: true})
  birthday?: Date;
  @Field(type => ROLE, {nullable: true})
  role?: ROLE;
  @Field(type => [AddMembershipInput], {nullable: true})
  groups?: AddMembershipInput[];
  @Field(type => [String], {nullable: true})
  children?: string[];
}

@Resolver(of => User)
export class UserResolver {
  @Authorized()
  @Query(returns => User)
  async user(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ): Promise<User> {
    const user = await ctx.UserModel.findById(id);
    if (!user) {
      throw new Error("User could not be found")
    }
    return user;
  }

  @Authorized()
  @Query(returns => [User])
  async users(
    @Arg("limit", type => Int, {nullable: true}) limit: number,
    @Arg("skip", type => Int, {nullable: true}) skip: number,
    @Ctx() ctx: ContextType
  ): Promise<User[]> {
    return await ctx.UserModel.find({}, null, { limit, skip })
  }

  @Authorized()
  @Query(returns => User, {nullable: true})
  async currUser(@Ctx() ctx: ContextType): Promise<User | undefined> {
    return ctx.user;
  }

  @Authorized()
  @Mutation(returns => MembershipPayload)
  async addGroup(
    @Arg("input") input: AddMembershipInput,
    @Ctx() ctx: ContextType
  ): Promise<MembershipPayload> {
    const newGroupID = new mongoose.Types.ObjectId();

    const troopDoc = await ctx.TroopModel.findById(input.troopID);
    if (!troopDoc) {
      throw new Error("No such troop");
    }
    if (input.role === ROLE.SCOUTMASTER) {
      troopDoc.scoutMaster = ctx.user!._id;
    }
    if (input.patrolID) {
      const patrol = troopDoc.patrols.id(input.patrolID);
      if (!patrol) {
        throw new Error("No such patrol");
      }
      patrol.members.push(ctx.user!._id);
    }
    troopDoc.save();

    const { children, ...membershipDetails } = input;
    if (children) {
      ctx.user!.children?.push(...children);
    }
    ctx.user!.groups.push({ _id: newGroupID, ...membershipDetails });
    ctx.user!.save();

    return {
      groupID: newGroupID,
      troopNumber: input.troopNumber
    };
  }

  @Authorized([ROLE.SCOUTMASTER])
  @Mutation(returns => User)
  async updateUser(
    @Arg("input") input: UpdateUserInput,
    @Arg("id", type => ID) id: mongoose.Types.ObjectId,
    @Ctx() ctx: ContextType
  ): Promise<User> {
    if (input.password) {
      const userDoc = await ctx.UserModel.findById(id);
      if (!userDoc) {
        throw new Error("No such user")
      }
      userDoc.password = input.password;
      userDoc.save();
      delete input.password;
    }
    const userDoc = await ctx.UserModel.findByIdAndUpdate(id, { ...input }, { new: true });
    if (!userDoc) {
      throw new Error("No such user");
    }
    return userDoc;
  }

  @Authorized([ROLE.SCOUTMASTER])
  @Mutation(returns => User)
  async deleteUser(
    @Arg("id", type => ID) id: mongoose.Types.ObjectId,
    @Ctx() ctx: ContextType
  ): Promise<User | null> {
    return await ctx.UserModel.findByIdAndDelete(id);
  }

  @Authorized()
  @Mutation(returns => User)
  async updateCurrUser(
    @Arg("input") input: UpdateUserInput,
    @Ctx() ctx: ContextType
  ): Promise<User | null> {
    return await ctx.UserModel.findByIdAndUpdate(ctx.user!._id, input, { new: true });
  }

  @Authorized()
  @Mutation(returns => Boolean)
  async dismissNotification(
    @Arg("id", type => ID) id: mongoose.Types.ObjectId,
    @Ctx() ctx: ContextType
  ): Promise<boolean> {
    const notif = ctx.user!.unreadNotifications.id(id);
    if (notif === null) {
      return false;
    }
    notif.remove();
    ctx.user!.save();
    return true;
  }
  

  @Authorized()
  @FieldResolver(returns => ROLE, {nullable: true})
  currRole(@Root() user: User, @Ctx() ctx: ContextType): ROLE | undefined {
    if (user._id.equals(ctx.user!._id)) {
      return ctx.currMembership?.role;
    }
  }

  @Authorized()
  @FieldResolver(returns => Troop)
  async currTroop(@Root() user: User, @Ctx() ctx: ContextType): Promise<Troop | undefined> {
    if (user._id.equals(ctx.user!._id) && ctx.currMembership) {
      return await ctx.TroopModel.findById(ctx.currMembership.troopID) ?? undefined;
    }
  }

  @Authorized()
  @FieldResolver(returns => Patrol)
  async currPatrol(@Root() user: User, @Ctx() ctx: ContextType): Promise<Patrol | undefined> {
    if (user._id.equals(ctx.user!._id) && ctx.currMembership) {
      const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID);
      if (myTroop) {
        return myTroop.patrols.id(ctx.currMembership.patrolID) ?? undefined;
      }
    }
  }

  @Authorized()
  @FieldResolver(returns => [Membership])
  otherGroups(@Ctx() ctx: ContextType): Membership[] {
    if (ctx.user && ctx.user.groups.length > 1) {
      return ctx.user.groups.reduce((mapped: Membership[], group) => {
        if (group._id && group._id.toString() !== ctx.membershipIDString) {
          mapped.push(group);
        }
        return mapped;
      }, []);
    }
    return [];
  }
}
