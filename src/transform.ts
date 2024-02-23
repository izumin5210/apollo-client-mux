import { DocumentTransform } from "@apollo/client/utilities";
import { DirectiveNode, type DocumentNode, Kind, visit } from "graphql";

import { defaultDirectiveArgName, defaultDirectiveName } from "./constants";

type EndpointDirectiveTransformerArgs = {
  endpointName: string;
  /** @defaultValue `"endpoint"` */
  directiveName?: string;
  /** @defaultValue `"name"` */
  directiveArgName?: string;
};

type DocumentTransformForCodegen<
  TDocumentFile extends {
    document: DocumentNode | null;
  },
  TArgs extends {
    documents: ReadonlyArray<TDocumentFile>;
  },
> = (args: TArgs) => TDocumentFile[];

/**
 *
 * @example with graphql-codegen
 * ```ts
 * const config: CodegenConfig = {
 *   generates: {
 *    "./src/gql/__generated__/": {
 *       preset: "client",
 *       config: {
 *         // ...
 *       },
 *       documentTransforms: [
 *         {
 *           transform: addEndpointDirectiveForCodegen({ endpointName: "graph2" }),
 *         },
 *       ],
 *     },
 *   },
 * }
 * ```
 */
export function addEndpointDirectiveForCodegen<
  TDocumentFile extends {
    document: DocumentNode | null;
  },
  TArgs extends {
    documents: ReadonlyArray<TDocumentFile>;
  },
>(
  args: EndpointDirectiveTransformerArgs,
): DocumentTransformForCodegen<TDocumentFile, TArgs> {
  return function transform({ documents }) {
    const transformer = addEndpointDirectiveTransform(args);
    return documents.map((documentFile) => {
      if (documentFile.document == null) return documentFile;
      documentFile.document = transformer.transformDocument(
        documentFile.document,
      );
      return documentFile;
    });
  };
}

export function addEndpointDirectiveTransform(
  args: EndpointDirectiveTransformerArgs,
) {
  return new DocumentTransform((d) => {
    return addEndpointDirectiveToDocument(d, args);
  });
}

function addEndpointDirectiveToDocument(
  d: DocumentNode,
  {
    endpointName,
    directiveName = defaultDirectiveName,
    directiveArgName = defaultDirectiveArgName,
  }: EndpointDirectiveTransformerArgs,
): DocumentNode {
  return visit(d, {
    FragmentDefinition(node) {
      const newNode: typeof node = {
        ...node,
        directives: [
          ...(node.directives ?? []),
          createEndpointDirectiveNode({
            directiveName,
            directiveArgName,
            endpointName,
          }),
        ],
      };
      return newNode;
    },
    OperationDefinition(node) {
      const newNode: typeof node = {
        ...node,
        directives: [
          ...(node.directives ?? []),
          createEndpointDirectiveNode({
            directiveName,
            directiveArgName,
            endpointName,
          }),
        ],
      };
      return newNode;
    },
  });
}

function createEndpointDirectiveNode(props: {
  directiveName: string;
  directiveArgName: string;
  endpointName: string;
}): DirectiveNode {
  return {
    kind: Kind.DIRECTIVE,
    name: {
      kind: Kind.NAME,
      value: props.directiveName,
    },
    arguments: [
      {
        kind: Kind.ARGUMENT,
        name: {
          kind: Kind.NAME,
          value: props.directiveArgName,
        },
        value: {
          kind: Kind.STRING,
          value: props.endpointName,
        },
      },
    ],
  };
}
