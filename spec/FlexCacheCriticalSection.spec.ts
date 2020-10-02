import { FlexCacheCriticalSection, IFlexCacheCriticalSectionConfig } from '../src/FlexCacheCriticalSection';
import { FlexCacheStub } from '@flex-cache/types';
import uuid from 'uuid';

jest.mock('uuid', () => ({ v4: () => 'Correct Lock ID' }));

describe('FlexCacheCriticalSection', () => {
    let cs: FlexCacheCriticalSection;
    let cache: FlexCacheStub = new FlexCacheStub();
    let correctLockId: string;
    const lockTtl: number = 10000;
    const config: IFlexCacheCriticalSectionConfig = { lockTtl };
    const expectedKey: string = '10bf91194-4a0e-4dcd-8238-65613f9ba917:test';

    beforeEach(() => {
        correctLockId = uuid.v4();

        cache = new FlexCacheStub();
        cache.stubs.set.resolves();
        cache.stubs.setForce.resolves();
        cache.stubs.update.resolves();
        cache.stubs.get.resolves(correctLockId);

        cs = new FlexCacheCriticalSection(cache, config);
    });
    
    describe('lock', () => {
        
        it('should lock resource and provide the Lock ID', () => {
            return expect(cs.lock('test')).resolves.toBe(correctLockId)
                .then(() => expect(cache.stubs.set.calledOnce).toBe(true))
                .then(() => expect(cache.stubs.set.calledWith(expectedKey, correctLockId, lockTtl)));
        });
        it('should reject if cache.set rejects wit error', () => {
            const exception = new Error('Test error');
            cache.stubs.set.rejects(exception);

            return expect(cs.lock('test')).rejects.toBe(exception);
        });
        it('should should use Lock TTL from arguments, otherwise from config', () => {
            return cs.lock('test')
                     .then(() => expect(cache.stubs.set.calledWith(expectedKey, correctLockId, lockTtl)))
                     .then(() => cs.lock('test', lockTtl + 1))
                     .then(() => expect(cache.stubs.set.calledWith(expectedKey, correctLockId, lockTtl + 1)));
        });
    });

    describe('unlock', () => {
        it('should unlock resource', () => {
            return cs.unlock('test', correctLockId)
                     .then(() => expect(cache.stubs.delete.calledOnce).toBe(true))
                     .then(() => expect(cache.stubs.delete.calledWith('lock:test', correctLockId, lockTtl)));
        });
        it('should reject if cache.get rejects wit error', () => {
            const exception = new Error('Test error');
            cache.stubs.get.rejects(exception);

            return expect(cs.unlock('test', correctLockId)).rejects.toBe(exception);
        });
        it('should resolve if cache.get resolved with null', () => {
            cache.stubs.get.resolves(null);

            return expect(cs.unlock('test', correctLockId)).resolves.toBeUndefined();
        });
        it('should reject if cache.get resolved with the another ID', () => {
            return expect(cs.unlock('test', 'Incorrect Lock ID')).rejects.toThrowError();
        });
        it('should delete the lock from the cache', () => {
            return cs.unlock('test', correctLockId)
                     .then(() => expect(cache.stubs.delete.calledOnce).toBe(true))
                     .then(() => expect(cache.stubs.delete.calledWith(expectedKey)).toBe(true));
        });
    });
});
