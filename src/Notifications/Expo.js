import { Expo } from "expo-server-sdk";
let expo = new Expo();

// fill messages

export const getTokens = async (Troop, User) => {
  const tokens = [];

  const troop = await Troop.findById("5e99f952a0d2524ecb6ceef8");

  const validPatrols = troop.patrols.filter((patrol) => patrol.members.length);

  const functionWithPromise = (user) => {
    tokens.push(user.expoNotificationToken);
    return Promise.resolve("ok");
  };

  const getUser = async (member) => {
    const user = await User.findById(member);
    return functionWithPromise(user);
  };

  await Promise.all(
    validPatrols.map((patrol) =>
      Promise.all(patrol.members.map((member) => getUser(member)))
    )
  );

  return tokens;
};

export const sendNotifications = (somePushTokens, body, data) => {
  let messages = [];
  for (let pushToken of somePushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: "default",
      body,
      data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
