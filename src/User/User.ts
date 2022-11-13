import mongoose, { Error } from 'mongoose';
import type { ObjectId } from 'mongoose';
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
  Root,
} from 'type-graphql';

import { Membership, ROLE } from '../../models/TroopAndPatrol';
import { User } from '../../models/User';
import { Troop } from '../../models/TroopAndPatrol';

import type { ContextType } from "../server";

registerEnumType(ROLE, {
  name: "Role",
  description: "A user's role within a patrol"
});

// @InputType()
// class AddMembershipInput implements Partial<Membership>{
//   @Field(type => ID)
//   public troopID!: Ref<Troop>;

//   @Field(type => ID)
//   public troopNumber!: string;

//   @Field()
//   public patrolID!: Ref<Patrol>;

//   @Field(type => ROLE)
//   public role!: ROLE;
// }

// @ObjectType()
// class MembershipPayload implements Partial<Membership> {
//   @Field(type => ID)
//   troopID: string;
//   @Field()
//   troopNumber: string;
// }

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
  birthday: Date;
}

// @InputType()
// class UpdateUserInput { // implements Partial<User>
//   @Field({nullable: true})
//   name?: string;
//   @Field({nullable: true})
//   email?: string;
//   @Field({nullable: true})
//   expoNotificationToken?: string;
//   @Field({nullable: true})
//   password?: string;
//   @Field({nullable: true})
//   phone?: string;
//   @Field({nullable: true})
//   birthday?: Date;
//   @Field(type => ROLE, {nullable: true})
//   role?: ROLE;
//   @Field(type => [AddMembershipInput], {nullable: true})
//   groups?: AddMembershipInput[];
//   @Field(type => [String], {nullable: true})
//   children?: string[];
// }

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

  // TODO: have not converted Troop and Patrol to type-graphql yet
  // @Authorized()
  // @Mutation(returns => MembershipPayload)
  // async addGroup(@Arg("input") input: AddMembershipInput, @Ctx() ctx: ContextType): Promise<MembershipPayload> {
  //   const newGroupID = new mongoose.Types.ObjectId();

  //   const troopDoc = await ctx.TroopModel.findById(input.troopID);
  //   if (!troopDoc) {
  //     throw new Error("No such troop");
  //   }
  //   if (input.role === ROLE.SCOUTMASTER) {
  //     troopDoc.scoutMaster = ctx.user!.id;
  //   }
  //   if (input.patrolID) {
  //     const patrol = troopDoc.patrols.find((patrol) => patrol.id === input.patrolID);
  //     if (!patrol) {
  //       throw new Error("No such patrol");
  //     }
  //     patrol.members.push(ctx.user!.id);
  //   }
  //   troopDoc.save();

  //   const { children, ...membershipDetails } = input;
  //   if (children) {
  //     ctx.user!.children?.push(...children);
  //   }
  //   ctx.user!.groups.push({ _id: newGroupID, ...membershipDetails });
  //   ctx.user!.save();

  //   return {
  //     troopID: newGroupID.toString(),
  //     troopNumber: input.troopNumber
  //   };
  // }

  // @Authorized([ROLE.SCOUTMASTER])
  // @Mutation(returns => User)
  // async updateUser(@Arg("input") input: UpdateUserInput, @Arg("id") id: number, @Ctx() ctx: ContextType) {
  //   if (input.password) {
  //     const userDoc = await UserModel.findById(id);
  //     if (!userDoc) {
  //       throw new Error("No such user")
  //     }
  //     userDoc.password = input.password;
  //     userDoc.save();
  //     delete input.password;
  //   }
  //   const userDoc = await UserModel.findByIdAndUpdate(id, { ...input }, { new: true });
  //   if (!userDoc) {
  //     throw new Error("No such user");
  //   }
  //   return userDoc;
  // }

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
  

  @Authorized()
  @FieldResolver(returns => ROLE, {nullable: true})
  currRole(@Root() user: User, @Ctx() ctx: ContextType): ROLE | undefined {
    if (user._id.equals(ctx.user!._id)) {
      return ctx.currMembership?.role;
    }
  }

  // TODO: have not converted Troop and Patrol to type-graphql yet
  // @FieldResolver(returns => )
  // async currTroop(@Root() user: User, @Ctx() ctx: ContextType) {
  //   if (user._id === ctx.user?._id && ctx.currMembership) {
  //     return await ctx.TroopModel.findById(ctx.currMembership.troopID);
  //   }
  // }

  // @FieldResolver()
  // async currPatrol(@Root() user: User, @Ctx() ctx: ContextType) {
  //   if (user._id === ctx.user?._id && ctx.currMembership) {
  //     const myTroop = await ctx.TroopModel.findById(ctx.currMembership.troopID);
  //     if (myTroop) {
  //       const myPatrol = await myTroop.patrols.id(ctx.currMembership.patrolID);
  //       return myPatrol;
  //     }
  //   }
  // }

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

// export const resolvers = {
//   Query: {
//     user: authenticated(async (_, { id }, { UserModel }) => await UserModel.findById(id)),
//     users: authenticated(async (_, { limit, skip }, { UserModel }) => {
//       return await UserModel.find({}, null, { limit, skip });
//     }),
//     currUser: async (_, __, { user }) => user,
//   },
//   Mutation: {
//     addGroup: authenticated(async (_, { input }, { user, UserModel, TroopModel }) => {
//       const newGroupID = mongoose.Types.ObjectId();

//       await TroopModel.findById(input.troopID, function (err, doc) {
//         if (input.role === "SCOUTMASTER") {
//           doc.scoutMaster = user.id;
//         }
//         if (input.patrolID) {
//           const currPatrol = doc.patrols.find(
//             (patrol) => patrol.id === input.patrolID
//           );
//           currPatrol.members.push(user.id);
//         }
//         doc.save();
//       });

//       await UserModel.findById(user.id, function (err, doc) {
//         if (err) return false;
//         const { children, ...membershipDetails } = input;
//         doc.children.push(...children);
//         doc.groups.push({ _id: newGroupID, ...membershipDetails });
//         doc.save();
//       });

//       return {
//         groupID: newGroupID,
//       };
//     }),
//     updateUser: authenticated(
//       authorized("SCOUTMASTER", async (_, { input, id }, { UserModel }) => {
//         if (typeof input.password === "string") {
//           input.password = await UserModel.findById(id, function (err, doc) {
//             if (err) return false;
//             doc.password = input.password;
//             doc.save();
//           });
//         }
//         return await UserModel.findByIdAndUpdate(id, { ...input }, { new: true });
//       })
//     ),
//     deleteUser: authenticated(
//       authorized(
//         "SCOUTMASTER",
//         async (_, { id }, { UserModel }) => await UserModel.findByIdAndDelete(id)
//       )
//     ),
//     updateCurrUser: authenticated(
//       async (_, { input }, { UserModel, user }) =>
//         await UserModel.findByIdAndUpdate(user.id, { ...input }, { new: true })
//     ),
//     deleteCurrUser: authenticated(
//       async (_, { id }, { UserModel }) => await UserModel.findByIdAndDelete(id)
//     ),
//     dismissNotification: authenticated(async (_, { id }, { user, UserModel }) => {
//       await UserModel.findById(user.id, function (err, doc) {
//         if (err) return false;

//         if (doc?.unreadNotifications) {
//           doc.unreadNotifications = doc.unreadNotifications.filter(
//             (notification) => notification.id !== id
//           );
//         }

//         doc.save();
//       });
//       return true;
//     }),
//   },
// };
