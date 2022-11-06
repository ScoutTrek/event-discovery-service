import { getModelForClass, modelOptions, prop, Ref, pre } from "@typegoose/typegoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { Membership, ROLES } from "./TroopAndPatrol";
import { Types } from "mongoose";

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
export class User {

  @prop({
    required: [true, "You must insert your name to create a valid user."],
    trim: true
  })
  public name!: string;

  @prop({
    required: [true, "To create a valid user you must enter an email address."],
    unique: false,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email."]
  })
  public email!: string;

  @prop({ default: DEFAULT_USER_PHOTO_URL })
  public userPhoto?: string;

  @prop({
    required: true,
    minlength: 8,
    select: false
  })
  public password!: string;

  @prop({
    validate: {
      validator: function (el: string) {
        return el === this.password;
      },
      message: "Passwords are not equal :("
    }
  })
  public passwordConfirm?: string;

  @prop()
  public expoNotificationToken?: string;

  @prop({
    validate: [
      validator.isMobilePhone,
      "Please provide a valid phone number",
    ],
    minlength: 10,
    maxlength: 11
  })
  public phone?: string;

  /**
   * NOTE:
   * `birthday` was previously optional
   * but should be absolute for age() getter to work
   */
  @prop({ required: true })
  public birthday!: Date;

  @prop({ type: () => [Membership] })
  public groups?: Membership[];

  @prop({ type: () => [String] })
  public children?: string[];

  @prop({ required: true, type: () => [Notification], default: [] })
  public unreadNotifications!: Notification[];

  // @prop({ ref: () => Event })
  // public events?: Ref<Event>[];

  @prop()
  public noGroups?: boolean;

  // @prop({ required: true, enum: ROLES })
  // public role!: string;

  /**
   * TODO: check functionality of function
   */
  public get age(): number {
    const todayAsMillis = new Date(Date.now()).getUTCMilliseconds();
    const bdayAsMillis = new Date(this.birthday).getUTCMilliseconds();
    return Math.floor((todayAsMillis - bdayAsMillis) / 1000 / 60 / 60 / 24 / 365);
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

export const UserModel = getModelForClass(User);
