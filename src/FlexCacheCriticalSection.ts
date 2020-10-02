import { IFlexCache } from '@flex-cache/types';
import { v4 as uuid } from 'uuid';

export interface IFlexCacheCriticalSection {
    lock<T>(resourceTag: string, lockTtl?: number): Promise<string>;
    unlock<T>(resourceTag: string, lockId: String): Promise<void>;
}

export interface IFlexCacheCriticalSectionConfig {
    lockTtl: number;
}

export class FlexCacheCriticalSection implements IFlexCacheCriticalSection {
    constructor(private cache: IFlexCache, private config: IFlexCacheCriticalSectionConfig) {
    }

    lock<T>(resourceTag: string, lockTtl?: number): Promise<string> {
        lockTtl = lockTtl ?? this.config.lockTtl;
        const key = FlexCacheCriticalSection.buildKey(resourceTag);
        const lockId = uuid();

        return this.cache.set(key, lockId, lockTtl)
                   .then(() => lockId);
    }

    unlock<T>(resourceTag: string, lockId: String): Promise<void> {
        const key = FlexCacheCriticalSection.buildKey(resourceTag);
        
        return this.cache.get<string>(key)
                   .then(result => {
                       if (result === lockId) {
                           return this.cache.delete(key);
                       }
                       if (result == null) {
                           return Promise.resolve();
                       }
                       return Promise.reject(new Error('Wrong lock ID'));
                   });
    }

    private static buildKey(resourceTag: string): string {
        return `10bf91194-4a0e-4dcd-8238-65613f9ba917:${resourceTag}`;
    }
}


