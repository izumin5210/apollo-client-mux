import {
  ApolloCache,
  Cache,
  Reference,
  Transaction,
} from "@apollo/client/core";
import { DocumentNode } from "graphql";
import { defaultDirectiveArgName, defaultDirectiveName } from "./constants";
import { getEndpointName, objectEntries, objectValues } from "./utils";

type NamespaceCacheOptions<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  TSerializedMap extends Record<string, any>,
  TDefaultSerialized,
> = {
  caches: {
    readonly [K in keyof TSerializedMap]: ApolloCache<TSerializedMap[K]>;
  };
  defaultCache: ApolloCache<TDefaultSerialized>;
  directiveName?: string;
  directiveArgName?: string;
};

type NamespaceCacheSerialized<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  TSerializedMap extends Record<string, any>,
  TDefaultSerialized,
> = {
  default: TDefaultSerialized;
  namespaced: TSerializedMap;
};

export class ApolloCacheMux<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  TSerializedMap extends Record<string, any>,
  TDefaultSerialized,
> extends ApolloCache<
  NamespaceCacheSerialized<TSerializedMap, TDefaultSerialized>
> {
  private readonly endpointNameCache = new Map<DocumentNode, string | null>();

  constructor(
    private readonly options: NamespaceCacheOptions<
      TSerializedMap,
      TDefaultSerialized
    >,
  ) {
    super();
  }

  private getCacheName(doc: DocumentNode): string | null {
    const cachedName = this.endpointNameCache.get(doc);
    if (cachedName !== undefined) {
      return cachedName;
    }
    const name =
      getEndpointName({
        documentNode: doc,
        directiveName: this.options.directiveName ?? defaultDirectiveName,
        directiveArgName:
          this.options.directiveArgName ?? defaultDirectiveArgName,
      }) ?? null;
    this.endpointNameCache.set(doc, name);
    return name;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private getCache(doc: DocumentNode): ApolloCache<any> {
    const name = this.getCacheName(doc);
    if (name === null) return this.options.defaultCache;

    const cache = this.options.caches[name];
    if (cache == null) {
      throw new Error(`No cache found for namespace ${name}`);
    }
    return cache;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private listAllCaches(): ApolloCache<any>[] {
    return [...objectValues(this.options.caches), this.options.defaultCache];
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override read<TData = any, TVariables = any>(
    query: Cache.ReadOptions<TVariables, TData>,
  ): TData | null {
    return this.getCache(query.query).read(query);
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override write<TData = any, TVariables = any>(
    write: Cache.WriteOptions<TData, TVariables>,
  ): Reference | undefined {
    return this.getCache(write.query).write(write);
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override diff<T>(query: Cache.DiffOptions<any, any>): Cache.DiffResult<T> {
    return this.getCache(query.query).diff(query);
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override watch<TData = any, TVariables = any>(
    watch: Cache.WatchOptions<TData, TVariables>,
  ): () => void {
    return this.getCache(watch.query).watch(watch);
  }
  override async reset(
    options?: Cache.ResetOptions | undefined,
  ): Promise<void> {
    await Promise.all(
      this.listAllCaches().map((cache) => cache.reset(options)),
    );
  }
  override evict(options: Cache.EvictOptions): boolean {
    let evicted = false;
    for (const cache of this.listAllCaches()) {
      evicted = cache.evict(options) || evicted;
    }
    return evicted;
  }
  override restore(
    serializedState: NamespaceCacheSerialized<
      TSerializedMap,
      TDefaultSerialized
    >,
  ): ApolloCache<NamespaceCacheSerialized<TSerializedMap, TDefaultSerialized>> {
    const defaultCache = this.options.defaultCache.restore(
      serializedState.default,
    );
    const caches = {} as {
      [K in keyof TSerializedMap]: ApolloCache<TSerializedMap[K]>;
    };
    for (const [name, cache] of objectEntries(this.options.caches)) {
      caches[name] = cache.restore(serializedState.namespaced[name]);
    }
    return new ApolloCacheMux({
      ...this.options,
      defaultCache,
      caches,
    });
  }
  override extract(
    optimistic?: boolean | undefined,
  ): NamespaceCacheSerialized<TSerializedMap, TDefaultSerialized> {
    let extracted: NamespaceCacheSerialized<
      TSerializedMap,
      TDefaultSerialized
    > = {
      default: this.options.defaultCache.extract(optimistic),
      namespaced: {} as TSerializedMap,
    };
    for (const [name, cache] of objectEntries(this.options.caches)) {
      extracted = {
        ...extracted,
        namespaced: {
          ...extracted.namespaced,
          [name]: cache.extract(optimistic),
        },
      };
    }
    return extracted;
  }
  override removeOptimistic(id: string): void {
    for (const cache of this.listAllCaches()) {
      cache.removeOptimistic(id);
    }
  }
  override performTransaction(
    transaction: Transaction<
      NamespaceCacheSerialized<TSerializedMap, TDefaultSerialized>
    >,
    optimisticId?: string | null | undefined,
  ): void {
    let f = () => transaction(this);
    for (const cache of this.listAllCaches()) {
      const _f = f;
      f = () => cache.performTransaction(_f, optimisticId);
    }

    f();
  }

  override transformDocument(document: DocumentNode): DocumentNode {
    return this.getCache(document).transformDocument(document);
  }

  override transformForLink(document: DocumentNode): DocumentNode {
    return this.getCache(document).transformForLink(document);
  }

  override gc(): string[] {
    let collected = [] as string[];
    for (const cache of this.listAllCaches()) {
      collected = [...collected, ...cache.gc()];
    }
    return collected;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override modify<Entity extends Record<string, any> = Record<string, any>>(
    options: Cache.ModifyOptions<Entity>,
  ): boolean {
    let modified = false;
    for (const cache of this.listAllCaches()) {
      modified = cache.modify(options) || modified;
    }
    return modified;
  }
}
