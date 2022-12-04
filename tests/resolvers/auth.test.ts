// Models
import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLResponse } from 'apollo-server-types';
import { buildSchemaSync } from 'type-graphql';

import { UserModel } from '../../models/models';
import contextFn from '../../src/context';
import { TypegooseMiddleware } from '../../src/middleware/typegoose_middlware';
import { AuthResolver } from '../../src/resolvers/auth';
import { PatrolResolver } from '../../src/resolvers/patrol';
import { TroopResolver } from '../../src/resolvers/troop';
import { UserResolver } from '../../src/resolvers/user';
import * as authFns from '../../src/utils/Auth';
import { setupDB } from '../test_setup';

setupDB('scouttrek-test');

const schema = buildSchemaSync({
  resolvers: [AuthResolver, UserResolver, TroopResolver, PatrolResolver],
  globalMiddlewares: [TypegooseMiddleware],
  authChecker: authFns.customAuthChecker,
});

// Create GraphQL server
const server = new ApolloServer({
  schema,
  context: contextFn,
});

describe("User signup", () => {
  describe("Create a new user", () => {
    let response: GraphQLResponse;

    beforeEach(async () => {
      const createUser = gql`
        mutation {
          signup(
            input: {
              name: "Test User"
              email: "test@example.com"
              password: "password"
              passwordConfirm: "password"
              phone: "1234567890"
              birthday: "2000-12-12"
            }
          ) {
            user {
              id
              name
              email
              phone
              birthday
            }
            token
            noGroups
          }
        }
      `;
      response = await server.executeOperation({
        query: createUser,
      });
    });

    test('correct fields should be returned', async () => {
      const createdUser = response.data?.signup.user;
      expect(createdUser.name).toBe("Test User");
      expect(createdUser.email).toBe("test@example.com");
      expect(createdUser.phone).toBe("1234567890");
      expect(new Date(createdUser.birthday).getTime()).toBe(new Date("2000-12-12").getTime());
    });

    test('user should be created in the db', async () => {
      const count = await UserModel.count({ _id: response.data?.signup.user.id });
      expect(count).toBe(1);
    });
  });
});
