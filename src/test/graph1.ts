import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql1 } from "./__generated__/graph1";
import type { Resolvers } from "./__generated__/graph1/graphql";

export const fragment1 = gql1(/* GraphQL */ `
  fragment User on User {
    id
    name
    email
  }
`);

export const query1 = gql1(/* GraphQL */ `
  query ListUsers {
    users {
      ...User
    }
  }
`);

const resolvers: Resolvers = {
  Query: {
    users: () => [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
      { id: "3", name: "Charlie", email: "charlie@example.com" },
    ],
  },
};

export const schema1 = makeExecutableSchema({
  typeDefs: readFileSync(join(__dirname, "graph1Schema.graphql"), {
    encoding: "utf8",
  }),
  resolvers,
});
