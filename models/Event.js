import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    troop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Troop",
      required: true,
    },
    patrol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patrol",
      required: "true",
    },
    title: {
      type: String,
      required: [true, "An event cannot have a blank title."],
    },
    description: String,
    datetime: Date,
    location: String,
    meetLocation: String,
    startDate: Date,
    endDate: Date,
    recurring: Boolean,
    day: {
      type: String,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
    },
    distance: Number,
    published: Boolean,
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

eventSchema.virtual("time").get(function() {
  let date = new Date(this.datetime);
  const formattedDate =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return formattedDate;
});

eventSchema.virtual("date").get(function() {
  let date = new Date(this.datetime);
  const monthNames = [
    "Jan.",
    "Feb.",
    "March",
    "April",
    "May",
    "June",
    "July",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];
  const formattedDate =
    monthNames[date.getMonth()] +
    " " +
    date.getDay() +
    ", " +
    date.getFullYear();
  return formattedDate;
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
