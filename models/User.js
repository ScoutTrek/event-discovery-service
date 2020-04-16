import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
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
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email."],
    },
    userPhoto: {
      type: String,
      default: "https://picsum.photos/200/200",
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: "Passwords are not equal :(",
      },
    },
    phone: {
      type: String,
      validate: [
        validator.isMobilePhone,
        "Please provide a valid phone number",
      ],
      minlength: 10,
      maxlength: 11,
    },
    birthday: {
      type: Date,
      required: true,
    },
    troop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Troop",
    },
    patrol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patrol",
    },
    role: {
      type: String,
      enum: [
        "SCOUT_MASTER",
        "SR_PATROL_LEADER",
        "PATROL_LEADER",
        "SCOUT",
        "PARENT",
      ],
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.isValidPassword = async function(submittedPass, realPass) {
  return await bcrypt.compare(submittedPass, realPass);
};

const User = mongoose.model("User", userSchema);

export default User;
