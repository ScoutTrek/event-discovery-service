import { modelOptions, prop as Property } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, ObjectType } from 'type-graphql';

import { Event } from './Event';
import { User } from './User';

import type { Ref } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
@ObjectType()
export class Roster {
  @Property({ required: true, ref: () => Event})
  public eventId!: Ref<Event, mongoose.Types.ObjectId>;

  @Field(type => [User])
  @Property({ required: true, ref: () => User })
  public yes!: Ref<User, mongoose.Types.ObjectId>[];

  @Field(type => [User])
  @Property({ required: true, ref: () => User })
  public no!: Ref<User, mongoose.Types.ObjectId>[];

  @Field(type => [User])
  @Property({ required: true, ref: () => User })
  public maybe!: Ref<User, mongoose.Types.ObjectId>[];
}
