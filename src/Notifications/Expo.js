import { Expo } from "expo-server-sdk";
let expo = new Expo();

// fill messages

export const getTokens = async (Troop, User, user) => {
  const tokens = [];

  let troop;
  if (user) {
    troop = await Troop.findById(user.troop);
  }

  if (troop) {
    const validPatrols = troop.patrols.filter(
      (patrol) => patrol.members.length
    );

    const functionWithPromise = (user) => {
      if (user && user.expoNotificationToken) {
        tokens.push(user.expoNotificationToken);
      }
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
  }

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
