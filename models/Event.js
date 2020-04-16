import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    type: {
      type: String,
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
    owner: {
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

tourSchema.post("save", function(doc, next) {
  console.log(doc);
});

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
