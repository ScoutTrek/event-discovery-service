import { modelOptions, pre, prop as Property } from '@typegoose/typegoose';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Field, ID, ObjectType } from 'type-graphql';
import validator from 'validator';

import { Notification } from './Notification';
import { Membership } from './TroopAndPatrol';

import type { ArraySubDocumentType, Ref } from "@typegoose/typegoose";

const DEFAULT_USER_PHOTO_URL = "https://res.cloudinary.com/wow-your-client/image/upload/c_scale,w_250/v1645286759/ScoutTrek/DefaultProfile.png";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  }
})
@pre<User>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
})
@ObjectType()
export class User {
  @Field(type => ID, {name: "id"})
  readonly _id: mongoose.Types.ObjectId;

  @Field()
  @Property({
    required: [true, "You must insert your name to create a valid user."],
    trim: true
  })
  public name!: string;

  @Field()
  @Property({
    required: [true, "To create a valid user you must enter an email address."],
    unique: false,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email."]
  })
  public email!: string;

  @Field()
  @Property({ required: true, default: DEFAULT_USER_PHOTO_URL })
  public userPhoto!: string;

  @Property({
    required: true,
    minlength: 8,
    select: false
  })
  public password!: string;

  @Property({
    validate: {
      validator: function (el: string) {
        return el === this.password;
      },
      message: "Passwords are not equal :("
    }
  })
  public passwordConfirm?: string;

  @Field({nullable: true})
  @Property()
  public expoNotificationToken?: string;

  @Field({nullable: true})
  @Property({
    validate: [validator.isMobilePhone, "Please provide a valid phone number"],
    minlength: 10,
    maxlength: 11
  })
  public phone?: string;

  @Field()
  @Property({required: true})
  public birthday!: Date;

  @Field(type => [Membership])
  @Property({ required: true, type: () => Membership, default: [] })
  public groups!: mongoose.Types.Array<ArraySubDocumentType<Membership>>;

  @Field(type => [String])
  @Property({ required: true, type: () => [String], default: [] })
  public children!: string[];

  @Field(type => [Notification])
  @Property({ required: true, type: () => Notification, default: [] })
  public unreadNotifications!: mongoose.Types.DocumentArray<ArraySubDocumentType<Notification>>;

  // @Field(type => [Event])
  // @Property({ required: true, ref: () => Event, default: [] })
  // public events!: Ref<Event, mongoose.Types.ObjectId>[];

  @Field({nullable: true})
  createdAt?: Date;

  @Field({nullable: true})
  updatedAt?: Date;

  @Field()
  age(): number {
    return Math.floor((Date.now() - this.birthday.getTime()) / 1000 / 60 / 60 / 24 / 365);
  }

  @Field()
  noGroups(): boolean {
    return this.groups.length === 0;
  }

  /**
   * TODO
   */
  public async isValidPassword(
    submittedPass: string,
    realPass: string
  ): Promise<boolean> {
    return await bcrypt.compare(submittedPass, realPass);
  }
}
