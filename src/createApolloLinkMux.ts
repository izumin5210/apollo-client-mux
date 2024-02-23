import { ApolloLink } from "@apollo/client/core";
import { removeDirectivesFromDocument } from "@apollo/client/utilities";

import { defaultDirectiveArgName, defaultDirectiveName } from "./constants";
import { getEndpointName, objectEntries } from "./utils";

export function createApolloLinkMux({
  links,
  defaultLink,
  directiveName = defaultDirectiveName,
  directiveArgName = defaultDirectiveArgName,
}: {
  links: Record<string, ApolloLink>;
  defaultLink: ApolloLink;
  /** @defaultValue `"endpoint"` */
  directiveName?: string;
  /** @defaultValue `"name"` */
  directiveArgName?: string;
}): ApolloLink {
  const removeDirectiveLink = new ApolloLink((operation, forward) => {
    const newQuery = removeDirectivesFromDocument(
      [{ name: directiveName, remove: true }],
      operation.query,
    );
    if (newQuery == null) {
      return forward(operation);
    }

    operation.query = newQuery;

    return forward(operation);
  });

  let composedLink = ApolloLink.from([removeDirectiveLink, defaultLink]);

  for (const [name, link] of objectEntries(links)) {
    composedLink = ApolloLink.split(
      (operation) =>
        getEndpointName({
          documentNode: operation.query,
          directiveName,
          directiveArgName,
        }) === name,
      ApolloLink.from([removeDirectiveLink, link]),
      composedLink,
    );
  }

  return composedLink;
}
