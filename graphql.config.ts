import type { IGraphQLConfig } from "graphql-config";
import type { CodegenConfig } from "@graphql-codegen/cli";
import { addEndpointDirectiveTransform } from "./src/transform";

const config: IGraphQLConfig = {
  projects: {
    graph1: {
      schema: "src/test/graph1Schema.graphql",
      documents: "src/test/graph1.ts",
      extensions: {
        codegen: {
          generates: {
            "src/test/__generated__/graph1/": {
              preset: "client",
              presetConfig: {
                gqlTagName: "gql1",
                fragmentMasking: false,
              },
              plugins: ["typescript-resolvers"],
            },
          },
        } satisfies CodegenConfig,
      },
    },
    graph2: {
      schema: "src/test/graph2Schema.graphql",
      documents: "src/test/graph2.ts",
      extensions: {
        codegen: {
          generates: {
            "src/test/__generated__/graph2/": {
              preset: "client",
              presetConfig: {
                gqlTagName: "gql2",
                fragmentMasking: false,
              },
              plugins: ["typescript-resolvers"],
              documentTransforms: [
                {
                  transform: ({ documents }) => {
                    return documents.map((documentFile) => {
                      if (documentFile.document == null) return documentFile;
                      documentFile.document = addEndpointDirectiveTransform({
                        endpointName: "graph2",
                      }).transformDocument(documentFile.document);

                      return documentFile;
                    });
                  },
                },
              ],
            },
          },
        } satisfies CodegenConfig,
      },
    },
  },
};

export default config;
