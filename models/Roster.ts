import { modelOptions, prop as Property, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, ObjectType } from 'type-graphql';

import { Patrol, Troop } from './TroopAndPatrol';
import { User } from './User';

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
@ObjectType()
export class Roster {
  @Field(type => [Troop])
  @Property({
    required: [true, "You must associate your event with at least one group."],
    ref: () => Troop
  })
  public groups!: Ref<Troop, mongoose.Types.ObjectId>[];

  @Field(type => [Patrol])
  @Property({
    required: true,
    ref: () => Patrol
  })
  public patrols!: Ref<Patrol, mongoose.Types.ObjectId>[];

  @Field(type => [User])
  @Property({
    required: true,
    ref: () => User
  })
  public individuals!: Ref<User, mongoose.Types.ObjectId>[];
}
