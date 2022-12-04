import { UserModel, EventModel, TroopModel } from "../../models/models";
import { ContextType } from "src/server";
import { AuthResolver } from "./auth";
import * as authFns from "../utils/Auth";

// jest.mock(UserModel);

// describe("User resolver", () => {
//     let resolver: AuthResolver;
//     let context: ContextType;

//     beforeEach(() => {
//         resolver = new AuthResolver();
//         context = {UserModel, EventModel, TroopModel, authFns};
//     });

//     test("sign up", () => {
//         const user = {
//             name: 'Test User',
//             email: 'test@example.com',
//             password: 'abc12345',
//             passwordConfirm: 'abc12345',
//             birthday: new Date(),
//         };
//         resolver.signup(user, context);

//         // expect(UserModel.)

//     })
// });