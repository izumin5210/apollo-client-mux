import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import {
  DocumentNode,
  FragmentDefinitionNode,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  type ValueNode,
} from "graphql";

export function getEndpointName({
  documentNode,
  directiveName,
  directiveArgName,
}: {
  documentNode: DocumentNode | TypedDocumentNode;
  directiveName: string;
  directiveArgName: string;
}): string | undefined {
  let defNode: OperationDefinitionNode | FragmentDefinitionNode | undefined;
  for (const node of documentNode.definitions) {
    switch (node.kind) {
      case Kind.OPERATION_DEFINITION: {
        // skip anonymous queries with only a fragment spread
        if (
          node.operation === OperationTypeNode.QUERY &&
          node.name == null &&
          node.selectionSet.selections.length === 1 &&
          node.selectionSet.selections[0]?.kind === Kind.FRAGMENT_SPREAD
        ) {
          continue;
        }
        defNode = node;
        break;
      }
      case Kind.FRAGMENT_DEFINITION: {
        defNode = node;
        break;
      }
    }
    if (defNode !== undefined) break;
  }

  if (defNode === undefined) {
    throw new Error("No operation or fragment definition found");
  }

  return (
    getStringValue(
      defNode.directives
        ?.find((d) => d.name.value === directiveName)
        ?.arguments?.find((a) => a.name.value === directiveArgName)?.value,
    ) || undefined
  );
}

function getStringValue(node: ValueNode | undefined): string | undefined {
  if (node?.kind === "StringValue") {
    return node.value;
  }
  return undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function objectValues<T extends Record<string, any>>(
  obj: T,
): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function objectEntries<T extends Record<string, any>>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
