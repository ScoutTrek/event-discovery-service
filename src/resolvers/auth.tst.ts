import { when } from 'jest-when';
import mongoose from 'mongoose';

import { EventModel, TroopModel, UserModel } from '../../models/models';
import { ContextType } from '../context';
import * as authFns from '../utils/Auth';
import { AuthResolver } from './auth';

jest.mock('../../models/models');

test("Stop complaining", () => {
    expect(1).toBe(1);
})

describe("User resolver", () => {
    let resolver: AuthResolver;
    let context: ContextType;

    beforeEach(() => {
        when(UserModel.create).calledWith(expect.anything()).mockResolvedValue({_id: new mongoose.Types.ObjectId()} as any);
        resolver = new AuthResolver();
        context = {UserModel, EventModel, TroopModel, authFns};
    });

    test("sign up", () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'abc12345',
            passwordConfirm: 'abc12345',
            birthday: new Date(),
        };
        resolver.signup(user, context);

        expect(UserModel.create).toHaveBeenCalled();
    })
});
