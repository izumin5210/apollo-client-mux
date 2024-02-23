import { gql } from "@apollo/client/core";
import { addEndpointDirectiveTransform } from "../transform";
import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";

const typeDefs1 = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type Query {
    users: [User]
  }
`;

const typeDefs2 = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    login: String!
  }
  type Query {
    users: [User]
  }
`;

export const schema1 = addMocksToSchema({
  schema: makeExecutableSchema({ typeDefs: typeDefs1 }),
  mocks: {
    Query: () => ({
      users: () => [
        { id: "1", name: "Alice", email: "alice@example.com" },
        { id: "2", name: "Bob", email: "bob@example.com" },
        { id: "3", name: "Charlie", email: "charlie@example.com" },
      ],
    }),
  },
});

export const schema2 = addMocksToSchema({
  schema: makeExecutableSchema({ typeDefs: typeDefs2 }),
  mocks: {
    Query: () => ({
      users: () => [
        { id: "1", name: "Alice", login: "alice" },
        { id: "2", name: "Bob", login: "bob" },
        { id: "3", name: "Charlie", login: "charlie" },
      ],
    }),
  },
});

export const fragment1 = gql`
  fragment User on User {
    id
    name
    email
  }
`;

const transformer = addEndpointDirectiveTransform({ endpointName: "graph2" });

export const fragment2 = transformer.transformDocument(gql`
  fragment User on User {
    id
    name
    login
  }
`);

export const query1 = gql`
  query ListUsers {
    users {
      ...User
    }
  }
  ${fragment1}
`;

export const query2 = transformer.transformDocument(gql`
  query ListUsers2 {
    users {
      ...User
    }
  }
  ${fragment2}
`);
