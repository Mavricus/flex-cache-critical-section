import { IFlexCacheCriticalSection } from './FlexCacheCriticalSection';
import { SinonStub } from 'sinon';
import sinon from 'sinon';

export class FlexCacheCriticalSectionStub implements IFlexCacheCriticalSection {
    stubs: {
        lock: SinonStub;
        unlock: SinonStub;
    }

    constructor() {
        this.stubs = {
            lock: sinon.stub(),
            unlock: sinon.stub()
        }
    }

    lock<T>(resourceTag: string, lockTtl?: number): Promise<string> {
        return this.stubs.lock(resourceTag, lockTtl);
    }

    unlock<T>(resourceTag: string, lockId: String): Promise<void> {
        return this.stubs.unlock(resourceTag, lockId);
    }
}
