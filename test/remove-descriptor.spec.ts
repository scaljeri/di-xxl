import {DI, chai, should, describe, beforeEach, it} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('#removeDescriptor', () => {
    let di;

    beforeEach(() => {
        di = new DI();

        DI.set({
            name: 'Foo',
            ns: 'remove',
            ref: fixtures.Foo
        });
    });

    describe('Instance', () => {
        beforeEach(() => {
            di.removeDescriptor('remove.Foo');
        });

        it('should have been deleted', () => {
            should.not.exist(di.get('remove.foo'));
        });

        it('should exist on the class level', () => {
            DI.get('remove.foo').should.exist;
        });
    });

    describe('Class', () => {
        beforeEach(() => {
            DI.removeDescriptor('remove.foo')
        });

        it('should have been deleted', () => {
            should.not.exist(DI.get('remove.foo'));
        });

        it('should have been deleted on the instance', () => {
            should.not.exist(di.get('remove.foo'));
        });
    });
});
