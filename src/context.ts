import { DocumentType } from '@typegoose/typegoose';
import { ContextFunction } from 'apollo-server-core';
import { Request } from 'express';
import mongoose from 'mongoose';

import { Event } from '../models/Event';
import { EventModel, TroopModel, UserModel } from '../models/models';
import { Membership, Troop } from '../models/TroopAndPatrol';
import { User } from '../models/User';
import { getUserNotificationData, UserData } from './notifications';
import * as authFns from './utils/Auth';

import type { ReturnModelType } from '@typegoose/typegoose';

export interface ContextType {
	UserModel: ReturnModelType<typeof User>,
	EventModel: ReturnModelType<typeof Event>,
	TroopModel: ReturnModelType<typeof Troop>,
	req?: Request,
	authFns: typeof authFns,
	tokens?: UserData[] | null,
	membershipIDString?: string,
	currMembership?: DocumentType<Membership>,
	user?: DocumentType<User>
}

const contextFn: ContextFunction = async ({ req }) => {
    let ret: ContextType = {
        UserModel,
        EventModel,
        TroopModel,
        req,
        authFns
    };

    const token = authFns.getTokenFromReq(req);
    if (!token) {
        return ret;
    }
    const user = await authFns.getUserFromToken(token);
    if (!user) {
        return ret;
    }

    // Update this for membership paradigm --(connie: not sure what this means but will leave the comment here )
    const membership = Array.isArray(req.headers?.membership) ? req.headers?.membership[0] : req.headers?.membership; // this is really bad... 

    const membershipIDString = membership === "undefined" ? undefined : new mongoose.Types.ObjectId(membership).toString();

    if (membershipIDString && user && user.groups) {
        ret.membershipIDString = membershipIDString;
        ret.user = user;
        const currMembership = user.groups.find((membership) => {
            return membership._id.equals(membershipIDString);
        });
        if (currMembership) {
            ret.tokens = await getUserNotificationData(currMembership.troop._id.toString());
            ret.currMembership = currMembership;
        }
    }

    return ret;
};

export default contextFn;