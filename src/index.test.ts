import { ApolloCache, ApolloClient, InMemoryCache } from "@apollo/client/core";
import { SchemaLink } from "@apollo/client/link/schema";
import { beforeEach, expect, test } from "vitest";

import { createApolloLinkMux, ApolloCacheMux } from ".";
import {
  fragment1,
  fragment2,
  query1,
  query2,
  schema1,
  schema2,
} from "./test/fixtures";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let cache: ApolloCache<any>;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let client: ApolloClient<any>;

beforeEach(() => {
  cache = new ApolloCacheMux({
    defaultCache: new InMemoryCache(),
    caches: {
      graph2: new InMemoryCache(),
    },
  });

  client = new ApolloClient({
    cache,
    ssrMode: true,
    link: createApolloLinkMux({
      links: {
        graph2: new SchemaLink({ schema: schema2 }),
      },
      defaultLink: new SchemaLink({ schema: schema1 }),
    }),
  });
});

test("the request is branched by the @endpoint directive, and the cache key is separated", async () => {
  expect(await client.query({ query: query1 })).toMatchSnapshot();
  expect(await client.query({ query: query2 })).toMatchSnapshot();

  expect(
    client.readFragment({
      fragment: fragment1,
      id: "User:1",
    }),
  ).toMatchSnapshot();

  expect(
    client.readFragment({
      fragment: fragment2,
      id: "User:1",
    }),
  ).toMatchSnapshot();

  expect(cache.readQuery({ query: query1 })).toMatchSnapshot();
  expect(cache.readQuery({ query: query2 })).toMatchSnapshot();
  expect(cache.extract()).toMatchSnapshot();
});
