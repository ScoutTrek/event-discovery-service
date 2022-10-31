import { Schema, Types, model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { membershipSchema, IMembership } from "./TroopAndPatrol";
import { notificationSchema, INotification } from "./Notification";

export interface IUser {
  name: string,
  email: string, 
  userPhoto: string,
  password: string,
  passwordConfirm?: string,
  expoNotificationToken?: string,
  phone: string,
  birthday?: Date,
  groups?: IMembership[],
  unreadNotifications?: INotification[],
  children?: StringConstructor[],
  events?: Types.ObjectId[],
  noGroups?: boolean,
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "You must insert your name to create a valid user."],
      trim: true,
    },
    email: {
      type: String,
      required: [
        true,
        "To create a valid user you must enter an email address.",
      ],
      unique: false,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email."],
    },
    userPhoto: {
      type: String,
      default:
        "https://res.cloudinary.com/wow-your-client/image/upload/c_scale,w_250/v1645286759/ScoutTrek/DefaultProfile.png",
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function (el: String) {
          return el === this.password;
        },
        message: "Passwords are not equal :(",
      },
    },
    expoNotificationToken: {
      type: String,
    },
    phone: {
      type: String,
      validate: [
        validator.isMobilePhone,
        "Please provide a valid phone number",
      ],
      minLength: 10,
      maxLength: 11,
    },
    birthday: {
      type: Date,
    },
    groups: [membershipSchema],
    children: [String],
    unreadNotifications: {
      type: [notificationSchema],
      default: [],
    },
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    noGroups: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("age").get(function () {
  let n = Date.now();
  let d: Date = new Date(this.birthday ?? Date.now());
  return Math.floor((n - d.getTime()) / 1000 / 60 / 60 / 24 / 365);
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.isValidPassword = async function (submittedPass: string, realPass: string) {
  return await bcrypt.compare(submittedPass, realPass);
};

const User = model<IUser>("User", userSchema);

export default User;
