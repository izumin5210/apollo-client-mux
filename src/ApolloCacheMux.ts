import {
  ApolloCache,
  Cache,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject,
  Reference,
} from "@apollo/client/core";
import { DocumentNode } from "graphql";
import { defaultDirectiveArgName, defaultDirectiveName } from "./constants";
import { getEndpointName, objectEntries, objectValues } from "./utils";

type NamespaceCacheOptions = {
  caches: Record<string, InMemoryCache>;
  directiveName?: string;
  directiveArgName?: string;
};

type NamespaceCacheSerialized = NormalizedCacheObject & {
  __MUX: {
    caches: Record<string, NormalizedCacheObject>;
  };
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Constructor<T> = new (...args: any[]) => T;

type CacheMuxConstructor<TCache extends InMemoryCache> = new (
  config: InMemoryCacheConfig & { mux: NamespaceCacheOptions },
) => TCache;

export function withCacheMux<TCache extends InMemoryCache>(
  Base: Constructor<TCache>,
): CacheMuxConstructor<TCache> {
  class ApolloCacheMux extends (Base as unknown as Constructor<InMemoryCache>) {
    private readonly endpointNameCache = new Map<DocumentNode, string | null>();
    private readonly muxOptions: NamespaceCacheOptions;

    constructor({
      mux,
      ...options
    }: InMemoryCacheConfig & { mux: NamespaceCacheOptions }) {
      super(options);
      this.muxOptions = mux;
    }

    $getCacheName(doc: DocumentNode): string | null {
      const cachedName = this.endpointNameCache.get(doc);
      if (cachedName !== undefined) {
        return cachedName;
      }
      const name =
        getEndpointName({
          documentNode: doc,
          directiveName: this.muxOptions.directiveName ?? defaultDirectiveName,
          directiveArgName:
            this.muxOptions.directiveArgName ?? defaultDirectiveArgName,
        }) ?? null;
      this.endpointNameCache.set(doc, name);
      return name;
    }

    private getCacheName(doc: DocumentNode): string | null {
      const cachedName = this.endpointNameCache.get(doc);
      if (cachedName !== undefined) {
        return cachedName;
      }
      const name =
        getEndpointName({
          documentNode: doc,
          directiveName: this.muxOptions.directiveName ?? defaultDirectiveName,
          directiveArgName:
            this.muxOptions.directiveArgName ?? defaultDirectiveArgName,
        }) ?? null;
      this.endpointNameCache.set(doc, name);
      return name;
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private getCache(doc: DocumentNode): ApolloCache<any> | null {
      const name = this.getCacheName(doc);
      if (name === null) {
        return null;
      }

      const cache = this.muxOptions.caches[name];
      if (cache == null) {
        throw new Error(`No cache found for namespace ${name}`);
      }
      return cache;
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    override read<TData = any, TVariables = any>(
      query: Cache.ReadOptions<TVariables, TData>,
    ): TData | null {
      const cache = this.getCache(query.query);
      if (cache) {
        return cache.read(query);
      }
      return super.read(query);
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    override write<TData = any, TVariables = any>(
      write: Cache.WriteOptions<TData, TVariables>,
    ): Reference | undefined {
      const cache = this.getCache(write.query);
      if (cache) {
        return cache.write(write);
      }
      return super.write(write);
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    override diff<T>(query: Cache.DiffOptions<any, any>): Cache.DiffResult<T> {
      const cache = this.getCache(query.query);
      if (cache) {
        return cache.diff(query);
      }
      return super.diff(query);
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    override watch<TData = any, TVariables = any>(
      watch: Cache.WatchOptions<TData, TVariables>,
    ): () => void {
      const cache = this.getCache(watch.query);
      if (cache) {
        return cache.watch(watch);
      }
      return super.watch(watch);
    }
    override async reset(
      options?: Cache.ResetOptions | undefined,
    ): Promise<void> {
      for (const cache of objectValues(this.muxOptions.caches)) {
        cache.reset(options);
      }
      super.reset(options);
    }
    override evict(options: Cache.EvictOptions): boolean {
      let evicted = false;
      for (const cache of objectValues(this.muxOptions.caches)) {
        evicted = cache.evict(options) || evicted;
      }
      evicted ||= super.evict(options);
      return evicted;
    }

    override restore(_data: NormalizedCacheObject) {
      const { __MUX: muxData, ...data } = _data as NamespaceCacheSerialized;
      super.restore(data);
      for (const [name, data] of objectEntries(muxData.caches)) {
        const cache = this.muxOptions.caches[name];
        if (cache == null) {
          throw new Error(`No cache found for namespace ${name}`);
        }
        cache.restore(data);
      }
      return this;
    }

    override extract(optimistic?: boolean | undefined): NormalizedCacheObject {
      const extracted: NamespaceCacheSerialized = Object.assign(
        super.extract(optimistic),
        { __MUX: { caches: {} } },
      );
      for (const [name, cache] of objectEntries(this.muxOptions.caches)) {
        extracted.__MUX.caches[name] = cache.extract(optimistic);
      }
      return extracted;
    }

    override removeOptimistic(id: string): void {
      for (const cache of objectValues(this.muxOptions.caches)) {
        cache.removeOptimistic(id);
      }
      super.removeOptimistic(id);
    }

    override performTransaction(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      update: (cache: InMemoryCache) => any,
      optimisticId?: string | null,
    ): void {
      let f = () => update(this);
      for (const cache of objectValues(this.muxOptions.caches)) {
        const _f = f;
        f = () => cache.performTransaction(_f, optimisticId);
      }

      f();
    }

    override transformDocument(document: DocumentNode): DocumentNode {
      const cache = this.getCache(document);
      if (cache) {
        return cache.transformDocument(document);
      }
      return super.transformDocument(document);
    }

    override transformForLink(document: DocumentNode): DocumentNode {
      const cache = this.getCache(document);
      if (cache) {
        return cache.transformForLink(document);
      }
      return super.transformForLink(document);
    }

    override gc(): string[] {
      let collected = [] as string[];
      for (const cache of objectValues(this.muxOptions.caches)) {
        collected = [...collected, ...cache.gc()];
      }
      collected = [...collected, ...super.gc()];
      return collected;
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    override modify<Entity extends Record<string, any> = Record<string, any>>(
      options: Cache.ModifyOptions<Entity>,
    ): boolean {
      let modified = false;
      for (const cache of objectValues(this.muxOptions.caches)) {
        modified ||= cache.modify(options);
      }
      modified = super.modify(options);
      return modified;
    }
  }

  return ApolloCacheMux as unknown as CacheMuxConstructor<TCache>;
}
