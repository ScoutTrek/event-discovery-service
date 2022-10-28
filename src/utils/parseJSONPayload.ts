export const hikeSchema = {
  metaData: {
    eventID: "hike",
    subtitle: "Plan a visit to the trail, let ScoutTrek take care of the rest.",
    image: {
      uri:
        "https://res.cloudinary.com/wow-your-client/image/upload/c_scale,w_550/v1582556921/ScoutTrek/hiking_trip.png",
    },
  },
  payload: [
    {
      fieldType: "shortText",
      fieldID: "title",
      title: "Hike Title",
      questionText: "What do you want to call your hike?",
    },
    {
      fieldType: "location",
      fieldID: "location",
      title: "Location",
      questionText: "Where do you want to hike?",
    },
    {
      fieldType: "setting",
      fieldID: "uniqueMeetLocation",
      title: "Location",
      questionText: "Where do you want everyone to meet?",
      payload: {
        options: ["The trail.", "A different meet point."],
        hideFields: ["meetTime", "leaveTime", "meetLocation"],
      },
    },
    {
      fieldType: "location",
      fieldID: "meetLocation",
      title: "Meet Location",
      questionText: "Where should everyone meet?",
    },
    {
      fieldType: "time",
      fieldID: "meetTime",
      title: "Meet Time",
      questionText: "What time should everybody get to your meet place?",
    },
    {
      fieldType: "time",
      fieldID: "leaveTime",
      title: "Leave Time",
      questionText: "What time do you plan to leave your meet place?",
    },
    {
      fieldType: "time",
      fieldID: "endDatetime",
      title: "End Time",
      questionText: "Around what time will you return from the hike?",
    },
    {
      fieldType: "date",
      fieldID: "day",
      title: "Date",
      questionTest: "When is your hike?",
    },
    {
      fieldType: "time",
      fieldID: "startTime",
      title: "Time",
      questionText: "What time should everybody be at the trailhead?",
    },

    {
      fieldType: "slider",
      name: "distance",
      title: "Distance",
      payload: {
        units: "Miles",
        min: 1,
        max: 26,
      },
      questionText: "Hike Distance (in miles)?",
    },
    {
      fieldType: "description",
      fieldID: "description",
      title: "Description",
      questionText:
        "What additional information do you want everyone to know about this hike?",
    },
  ],
};

