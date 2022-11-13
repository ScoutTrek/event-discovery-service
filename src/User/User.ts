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
  registerEnumType,
  Resolver,
  ResolverInterface,
  Root,
} from 'type-graphql';

import { TroopModel, UserModel } from '../../models/models';
import { ROLE } from '../../models/TroopAndPatrol';
import { User as UserSchema } from '../../models/User';
import { Troop as TroopSchema } from '../../models/TroopAndPatrol';
import { authenticated, authorized } from '../utils/Auth';

import type { ContextType } from "../server";
import { getIdFromRef } from 'src/utils/db';
registerEnumType(ROLE, {
  name: "Role",
  description: "A user's role within a patrol"
});

@ObjectType()
class Notification {
  @Field(type => ID)
  id: string;
  @Field()
  title: string;
  @Field()
  type: string;
  @Field()
  eventType: string;
  @Field(type => ID)
  eventID: string;
  @Field()
  createdAt: string;
}

@ObjectType()
class Membership {
  @Field(type => ID)
  id: string;
  @Field(type => ID)
  troopID: string;
  @Field()
  troopNumber: string;
  @Field(type => ID)
  patrolID: string;
  @Field(type => ROLE)
  role: ROLE;
}

@InputType()
class AddMembershipInput implements Partial<Membership>{
  @Field(type => ID)
  troopID: string;
  @Field()
  troopNumber: string;
  @Field(type => ID)
  patrolID: string;
  @Field(type => ROLE)
  role: ROLE;
  @Field({nullable: "itemsAndList"})
  children?: string[]
}

@ObjectType()
export class User {
  @Field(type => ID)
  _id: string;
  @Field({nullable: true})
  expoNotificationToken?: string;
  @Field({nullable: true})
  createdAt?: string;
  @Field({nullable: true})
  updatedAt?: string
  @Field()
  name: string;
  @Field()
  email: string;
  @Field({nullable: true})
  phone?: string;
  @Field()
  birthday: Date;
  @Field(type => Int)
  age: number;
  // @Field(type => Troop, {nullable: true})
  // currTroop?: Troop;
  // @Field(type => Patrol, {nullable: true})
  // currPatrol?: Patrol;
  @Field(type => ROLE, {nullable: true})
  currRole?: ROLE;
  @Field(type => [Membership], {nullable: "itemsAndList"})
  groups?: Membership[]
  @Field(type => Event, {nullable: true})
  events?: Event;
  @Field(type => [String], {nullable: "itemsAndList"})
  children?: string[];
  @Field()
  userPhoto: string;
  @Field(type => [Notification], {nullable: "itemsAndList"})
  unreadNotifications?: Notification[];
}

@ObjectType()
class MembershipPayload implements Partial<Membership> {
  @Field(type => ID)
  troopID: string;
  @Field()
  troopNumber: string;
}

@InputType()
class AddUserInput implements Partial<User> {
  @Field()
  name: string;
  @Field()
  email: string;
  @Field()
  password: string;
  @Field()
  passwordConfirm: string;
  @Field({nullable: true})
  expoNotificationToken?: string;
  @Field({nullable: true})
  phone?: string;
  @Field()
  birthday: string;
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
  birthday?: string;
  @Field(type => ROLE, {nullable: true})
  role?: ROLE;
  @Field(type => [AddMembershipInput], {nullable: true})
  groups?: AddMembershipInput[];
  @Field(type => [String], {nullable: true})
  children?: string[];
}

type Mutation {
  addGroup(input: AddMembershipInput): MembershipPayload
  updateUser(input: UpdateUserInput!, id: ID!): User
  deleteUser(id: ID!): User
  updateCurrUser(input: UpdateUserInput!): User
  deleteCurrUser: User
  dismissNotification(id: ID!): Boolean!
}

@Resolver(of => User)
class UserResolver implements ResolverInterface<User> {
  @Authorized()
  @Query(returns => User)
  async user(
    @Arg("id", type => ID) id: string,
    @Ctx() ctx: ContextType
  ) {
    return await ctx.UserModel.findById(id);
  }

  @Authorized()
  @Query(returns => [User])
  async users(
    @Arg("limit", type => Int, {nullable: true}) limit: number,
    @Arg("skip", type => Int, {nullable: true}) skip: number,
    @Ctx() ctx: ContextType
  ) {
    return await UserModel.find({}, null, { limit, skip })
  }

  @Query(returns => User)
  async currUser(@Ctx() ctx: ContextType) {
    return ctx.user;
  }

  @Authorized()
  @Mutation()
  addGroup(@Arg("input") input: AddMembershipInput, @Ctx() ctx: ContextType): MembershipPayload {
    const newGroupID = new mongoose.Types.ObjectId();

    const troopDoc = await ctx.TroopModel.findById(input.troopID);
    if (!troopDoc) {
      throw new Error("No such troop");
    }
    if (input.role === ROLE.SCOUTMASTER) {
      troopDoc.scoutMaster = ctx.user!.id;
    }
    if (input.patrolID) {
      const patrol = troopDoc.patrols.find((patrol) => patrol.id === input.patrolID);
      if (!patrol) {
        throw new Error("No such patrol");
      }
      patrol.members.push(ctx.user!.id);
    }
    troopDoc.save();

    const { children, ...membershipDetails } = input;
    if (children) {
      ctx.user!.children?.push(...children);
    }
    ctx.user!.groups.push({ _id: newGroupID, ...membershipDetails });
    ctx.user!.save();

    return {
      troopID: newGroupID.toString(),
      troopNumber: input.troopNumber
    };
  }

  @Authorized([ROLE.SCOUTMASTER])
  @Mutation()
  updateUser(@Arg("input") input: UpdateUserInput, @Arg("id") id: number, @Ctx() ctx: ContextType): User {
    if (input.password) {
      const userDoc = await UserModel.findById(id);
      if (!userDoc) {
        throw new Error("No such user")
      }
      userDoc.password = input.password;
      userDoc.save();
      delete input.password;
    }
    const userDoc = await UserModel.findByIdAndUpdate(id, { ...input }, { new: true });
    if (!userDoc) {
      throw new Error("No such user");
    }
    return userDoc;
  }

  // @Mutation()
  // deleteUser(@Arg("id") id: number, @Ctx() ctx: ContextType): User {
    
  // }

  // @Mutation()
  // updateCurrUser(@Arg("input") input: UpdateUserInput, @Ctx() ctx: ContextType): User {
    
  // }

  // @Mutation()
  // deleteCurrUser(@Ctx() ctx: ContextType): User {
    
  // }

  // @Mutation()
  // dismissNotification(@Arg("id") id: number, @Ctx() ctx: ContextType): boolean {
    
  // }
  

  @FieldResolver()
  currRole(@Root() user: User, @Ctx() ctx: ContextType) {
    if (user.id === ctx.user?.id) {
      return ctx.currMembership?.role;
    }
  }

  // @FieldResolver()
  // currTroop(@Root() user: User, @Ctx() ctx: ContextType) {
  //   if (user.id === ctx.user?.id && ctx.currMembership) {
  //     return await ctx.TroopModel.findById(ctx.currMembership.troopID);
  //   }
  // }

  // @FieldResolver()
  // currPatrol(@Root() user: User, @Ctx() ctx: ContextType) {
  //   if (user.id === ctx.user?.id && ctx.currMembership) {
  //     const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID);
  //     if (myTroop) {
  //       const myPatrol = await myTroop.patrols.id(ctx.currMembership.patrolID);
  //       return myPatrol;
  //     }
  //   }
  // }

  @FieldResolver()
  otherGroups(@Root() user: User, @Ctx() ctx: ContextType) {
    if (ctx.user && ctx.user.groups.length > 1) {
      return ctx.user.groups.reduce((mapped: Membership[], group) => {
        if (group._id && group._id !== ctx.membershipIDString) {
          mapped.push({
            id: group._id.toString(),
            troopID: getIdFromRef(group.troopID).toString(),
            troopNumber: group.troopNumber,
            patrolID: getIdFromRef(group.patrolID).toString(),
            role: group.role,
          });
        }
        return mapped;
      }, []);
    }
    return [];
  }

  @FieldResolver()
  noGroups(@Root() user: User, @Ctx() ctx: ContextType) {
    return !user.groups?.length;
  }

  @FieldResolver()
  unreadNotifications(@Root() user: User, @Ctx() ctx: ContextType) {
    return user.unreadNotifications;
  }
}

export const resolvers = {
  Query: {
    user: authenticated(async (_, { id }, { UserModel }) => await UserModel.findById(id)),
    users: authenticated(async (_, { limit, skip }, { UserModel }) => {
      return await UserModel.find({}, null, { limit, skip });
    }),
    currUser: async (_, __, { user }) => user,
  },
  Mutation: {
    addGroup: authenticated(async (_, { input }, { user, UserModel, TroopModel }) => {
      const newGroupID = mongoose.Types.ObjectId();

      await TroopModel.findById(input.troopID, function (err, doc) {
        if (input.role === "SCOUTMASTER") {
          doc.scoutMaster = user.id;
        }
        if (input.patrolID) {
          const currPatrol = doc.patrols.find(
            (patrol) => patrol.id === input.patrolID
          );
          currPatrol.members.push(user.id);
        }
        doc.save();
      });

      await UserModel.findById(user.id, function (err, doc) {
        if (err) return false;
        const { children, ...membershipDetails } = input;
        doc.children.push(...children);
        doc.groups.push({ _id: newGroupID, ...membershipDetails });
        doc.save();
      });

      return {
        groupID: newGroupID,
      };
    }),
    updateUser: authenticated(
      authorized("SCOUTMASTER", async (_, { input, id }, { UserModel }) => {
        if (typeof input.password === "string") {
          input.password = await UserModel.findById(id, function (err, doc) {
            if (err) return false;
            doc.password = input.password;
            doc.save();
          });
        }
        return await UserModel.findByIdAndUpdate(id, { ...input }, { new: true });
      })d
    ),
    deleteUser: authenticated(
      authorized(
        "SCOUTMASTER",
        async (_, { id }, { UserModel }) => await UserModel.findByIdAndDelete(id)
      )
    ),
    updateCurrUser: authenticated(
      async (_, { input }, { UserModel, user }) =>
        await UserModel.findByIdAndUpdate(user.id, { ...input }, { new: true })
    ),
    deleteCurrUser: authenticated(
      async (_, { id }, { UserModel }) => await UserModel.findByIdAndDelete(id)
    ),
    dismissNotification: authenticated(async (_, { id }, { user, UserModel }) => {
      await UserModel.findById(user.id, function (err, doc) {
        if (err) return false;

        if (doc?.unreadNotifications) {
          doc.unreadNotifications = doc.unreadNotifications.filter(
            (notification) => notification.id !== id
          );
        }

        doc.save();
      });
      return true;
    }),
  },
};
