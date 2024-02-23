import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql2 } from "./__generated__/graph2";
import type { Resolvers } from "./__generated__/graph2/graphql";

export const fragment2 = gql2(/* GraphQL */ `
  fragment User on User {
    id
    name
    login
  }
`);

export const query2 = gql2(/* GraphQL */ `
  query ListUsers2 {
    users {
      ...User
    }
  }
`);

const resolvers: Resolvers = {
  Query: {
    users: () => [
      { id: "1", name: "Alice", login: "alice" },
      { id: "2", name: "Bob", login: "bob" },
      { id: "3", name: "Charlie", login: "charlie" },
    ],
  },
};

export const schema2 = makeExecutableSchema({
  typeDefs: readFileSync(join(__dirname, "graph2schema.graphql"), {
    encoding: "utf8",
  }),
  resolvers,
});
