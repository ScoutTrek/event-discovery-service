import { isDocument } from '@typegoose/typegoose';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import mongoose, { Error, Types } from 'mongoose';

import { TroopModel, UserModel } from '../models/models';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

import type { DocumentType } from "@typegoose/typegoose";

let expo = new Expo();

export type UserData = {
  token?: string;
  userID: string;
}

// fill messages
// TODO: is `troopID` a string that gets converted into a ObjectID automatically?
export const getUserNotificationData = async (troopID: string): Promise<Array<UserData>> => {
  const userData: Array<UserData> = [];

  const troop = await TroopModel.findById(troopID);

  if (!troop || !troop.patrols) {
    return [];
  }

  // patrols with not undefined members
  const validPatrols = troop.patrols.filter((patrol) => patrol.members.length);

  /**
   * TODO:
   * @param memberId
   */
  const addUser = async (memberId: mongoose.Types.ObjectId): Promise<void> => {
    const user = await UserModel.findById(memberId);
    if (!user) return Promise.resolve();;
    if (user.expoNotificationToken) {
      userData.push({ token: user.expoNotificationToken, userID: user.id });
    }
    return Promise.resolve();
  };

  await Promise.all(
    validPatrols.map((patrol) =>
      Promise.all(patrol.members.map((member) => addUser(member._id)))
    )
  );

  return userData;
};

export const sendNotifications = async (userData: UserData[], body: string, data: {type: string, eventType: string, ID: string, notificationID?: Types.ObjectId}) => {
  let messages: ExpoPushMessage[] = [];
  for (let user of userData) {
    const { userID, token } = user;

    const notification: Notification = {
      _id: new mongoose.Types.ObjectId(),
      title: body,
      type: data.type,
      eventType: data.eventType,
      eventID: data.ID,
    };

    let doc = await UserModel.findByIdAndUpdate(userID, {$push: {unreadNotifications: notification}}, {new: true});

    if (!doc) {
      continue;
    }
    
    const notificationData = doc.unreadNotifications[doc.unreadNotifications.length - 1];

    data = { ...data, notificationID: notificationData!._id };

    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      return;
    }

    messages.push({
      to: token,
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
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
