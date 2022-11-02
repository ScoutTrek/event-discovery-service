import { createSchema, Type, typedModel, ExtractDoc, ExtractProps } from "ts-mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { membershipSchema } from "./TroopAndPatrol";
import { notificationSchema } from "./Notification";
import { eventSchema } from "./Event";

// export interface IUser {
//   name: string;
//   email: string;
//   userPhoto: string;
//   password: string;
//   passwordConfirm?: string;
//   expoNotificationToken?: string;
//   phone: string;
//   birthday?: Date;
//   groups?: Types.DocumentArray<IMembership>;
//   unreadNotifications?: Types.DocumentArray<INotification>;
//   children?: string[];
//   events?: Types.ObjectId[];
//   noGroups?: boolean;
// }

const defaultUserPhotoURL = "https://res.cloudinary.com/wow-your-client/image/upload/c_scale,w_250/v1645286759/ScoutTrek/DefaultProfile.png";

export const userSchema = createSchema({
  name: Type.string({
    required: true,
    trim: true
  }),
  email: Type.string({
    required: true,
    unique: false,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email."
    }
  }),
  userPhoto: Type.string({
    default: defaultUserPhotoURL
  }),
  password: Type.string({
    required: true,
    minLength: 8,
    select: false
  }),
  passwordConfirm: Type.string({
    validate: {
      validator: function (el: String) {
        return el === this.password;
      },
      message: "Passwords are not equal :(",
    }
  }),
  expoNotificationToken: Type.string(),
  phone: Type.string({
    validate: {
      validator: validator.isMobilePhone,
      message: "Please provide a valid phone number"
    },
    minLength: 10,
    maxLength: 11
  }),
  birthday: Type.date(),
  groups: Type.array().of(membershipSchema),
  children: Type.array().of(Type.string()),
  unreadNotifications: Type.array({ default: [] }).of(notificationSchema),
  events: Type.array().of(
    Type.ref(Type.objectId()).to("Event", eventSchema)
  ),
  noGroups: Type.boolean(),
}, { timestamps: true });

userSchema.virtual("age").get(function () {
  let n = Date.now();
  let d: Date = new Date(this.birthday ?? Date.now());
  return Math.floor((n - d.getTime()) / 1000 / 60 / 60 / 24 / 365);
});

userSchema.pre("save", async function (next: Function) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.isValidPassword = async function (submittedPass: string, realPass: string) {
  return await bcrypt.compare(submittedPass, realPass);
};

const User = typedModel("User", userSchema);
export type UserDoc = ExtractDoc<typeof userSchema>;
export type UserProps = ExtractProps<typeof userSchema>;

export default User;
