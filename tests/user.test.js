require("@babel/register");
require("@babel/polyfill/noConflict");

// Models
import User from "../models/User";
import Event from "../models/Event";
import Troop from "../models/TroopAndPatrol";

import ApolloBoost, { gql } from "apollo-boost";

import fetch from "unfetch";

const client = new ApolloBoost({
  fetch,
  uri: "http://localhost:4000",
  request: (operation) => {
    operation.setContext({
      headers: {
        authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlOThjZTc5NTQ0OWM0MTkwYWY2YTUwNiIsInJvbGUiOiJTQ09VVF9NQVNURVIiLCJpYXQiOjE1ODcwNzI2MzQsImV4cCI6MTU5MTgyNDYzNH0.xaEvK-7I168-6Opu9avjNdUqANgS2PbIv30kyC5tG30`,
      },
    });
  },
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
          role: SCOUT
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
  const response = await client.mutate({
    mutation: createUser,
  });

  const exists = User.count(
    { _id: response.data.createUser.user.id },
    function (err, count) {
      if (count > 0) {
        return true;
      }
    }
  );

  expect(exists).toBe(true);
});
