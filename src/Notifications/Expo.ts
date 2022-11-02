import { Expo } from "expo-server-sdk";
import { ITroop } from "models/TroopAndPatrol";
import { Model } from "mongoose";
import User, { UserDoc } from "../../models/User";

let expo = new Expo();

export type UserData = {
  token?: string;
  userID: string;
}

// fill messages
// TODO: is `troopID` a string that gets converted into a ObjectID automatically?
export const getUserNotificationData = async (
  Troop: Model<ITroop>,
  troopID: string
): Promise<Array<UserData>> => {
  const userData: Array<unknown> = [];

  const troop: ITroop | null = await Troop.findById(troopID);

  if (!troop || !troop.patrols) {
    return [];
  }

  // patrols with not undefined members
  const validPatrols = troop.patrols.filter((patrol) => patrol.members?.length);

  /**
   * TODO
   * @param user 
   */
  const addToUserData = (user: UserDoc): Promise<string> => {
    if (user.expoNotificationToken) {
      userData.push({ token: user.expoNotificationToken, userID: user.id });
    }
    return Promise.resolve("ok");
  };

  /**
   * TODO
   * @param memberId
   */
  const getUser = async (memberId: string): Array<UserData> => {
    const user: IUser | null = await User.findById(memberId);
    await addToUserData(user);
    return userData;
  };

  await Promise.all(
    validPatrols.map((patrol) =>
      Promise.all(patrol.members.map((member) => getUser(member)))
    )
  );

  return userData;

  // let troop;

  // if (troopID) {
  // troop = await Troop.findById(troopID);
  // }

  // if (troop) {
  //   const validPatrols = troop.patrols?.filter(
  //     (patrol) => patrol.members?.length
  //   );

  //   const addToUserData = (user) => {
  //     if (user && user.expoNotificationToken) {
  //       userData.push({ token: user.expoNotificationToken, userID: user.id });
  //     }
  //     return Promise.resolve("ok");
  //   };

  //   const getUser = async (member) => {
  //     const user = await User.findById(member);
  //     return addToUserData(user);
  //   };

  //   await Promise.all(
  //     validPatrols.map((patrol) =>
  //       Promise.all(patrol.members.map((member) => getUser(member)))
  //     )
  //   );
  // }

  // return userData;
};

export const sendNotifications = (userData, body, data) => {
  let messages = [];
  for (let user of userData) {
    const { userID, token } = user;

    let notificationData;

    User.findById(userID, function (err, doc) {
      if (err) return false;
      const notification = {
        title: body,
        type: data.type,
        eventType: data.eventType,
        eventID: data.ID,
      };

      let index = doc.unreadNotifications.push(notification);
      doc.save();
      notificationData = doc.unreadNotifications[index - 1];
    });

    data = { ...data, notificationID: notificationData._id };

    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      vibrate: true,
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
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
