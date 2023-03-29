import { modelOptions, prop as Property, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, ObjectType } from 'type-graphql';

import { User } from './User';

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
@ObjectType()
export class Roster {
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
