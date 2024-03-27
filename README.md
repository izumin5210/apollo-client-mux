# Apollo Client Mux
`apollo-client-mux` is a library designed to handle multiple GraphQL endpoints within a single Apollo Client instance. It allows you to set different caches and links for different endpoints.

## Usage

### Step 1: add `@endpoint` directive to operation documents

```ts
// codegen.<yourEndpointName>.ts
import type { CodegenConfig } from "@graphql-codegen/cli";
import { addEndpointDirectiveForCodegen } from "apollo-client-mux/transform";

const config: CodegenConfig = {
  // ...
  generates: {
    "src/gql/<yourEndpoint>/": { // <- use your endopint name
      preset: "client",
      documentTransforms: [
        {
          transform: addEndpointDirectiveForCodegen({
            endpointName: "yourEndpoint", // <- use your endopint name
          }),
        },
      ],
    },
  },
};

export default config;
```

### Step 2: Create ApolloCache and ApolloLink for multiple endpoints

```ts
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloCacheMux, withCacheMux } from "apollo-client-mux";

// create ApolloCache
const InMemoryCacheMux = withCacheMux(InMemoryCache);
const yourEndpointCache = new InMemoryCache();
const cache = new InMemoryCacheMux({
  mux:{
    caches: {
      yourEndpoint: yourEndpointCache, // <-- use your endopint name
    },
  }
  // ... options for default cache
});

// create ApolloLink
const yourEndpointHttpLinnk = new HttpLink({ /* ... */ });
const defaultHttpLinnk = new HttpLink({ /* ... */ });
const link = createApolloLinkMux({
  links: {
    yourEndpoint: yourEndpointHttpLink, // <-- use your endopint name
  },
  defaultLink: defaultHttpLink;
});

// create Apollo Client
const client = new ApolloClient({
  cache,
  link,
});
```
