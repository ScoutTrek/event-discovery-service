// Models
import { ApolloServer, gql } from 'apollo-server-express';
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

test("Creates a new user", async () => {
  const createUser = gql`
    mutation {
      signup(
        input: {
          name: "Elise Chavenport"
          email: "elisemeChavenport@gmail.com"
          password: "password"
          passwordConfirm: "password"
          phone: "8658061326"
          birthday: "2000-12-12"
        }
      ) {
        user {
          id
          name
        }
        token
      }
    }
  `;
  const response = await server.executeOperation({
    query: createUser,
  });

  const count = await UserModel.count({ _id: response.data?.signup.user.id });
  expect(count).toBe(1);
});
