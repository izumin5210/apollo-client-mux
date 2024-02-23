import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
/* eslint-disable */
import * as types from "./graphql";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  "\n  fragment User on User {\n    id\n    name\n    email\n  }\n":
    types.UserFragmentDoc,
  "\n  query ListUsers {\n    users {\n      ...User\n    }\n  }\n":
    types.ListUsersDocument,
};

/**
 * The gql1 function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql1(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql1(source: string): unknown;

/**
 * The gql1 function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql1(
  source: "\n  fragment User on User {\n    id\n    name\n    email\n  }\n",
): (typeof documents)["\n  fragment User on User {\n    id\n    name\n    email\n  }\n"];
/**
 * The gql1 function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql1(
  source: "\n  query ListUsers {\n    users {\n      ...User\n    }\n  }\n",
): (typeof documents)["\n  query ListUsers {\n    users {\n      ...User\n    }\n  }\n"];

export function gql1(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
