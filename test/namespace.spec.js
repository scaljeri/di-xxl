import {DI, chai, should} from './helpers';

describe('Objects - ACTIONS.NONE', () => {
    let di;

    beforeEach(() => {
        di = new DI();

        di.set({
            ns: 'a.b.c.d',
            name: 'Foo',
            ref: {ns: 'a.b.c.d'}
        })
            .set({
                ns: 'a.b.c',
                name: 'Foo',
                ref: {ns: 'a.b.c'}
            })
            .set({
                ns: 'a.b',
                name: 'Foo',
                ref: {ns: 'a.b'}
            })
            .set({
                ns: 'a',
                name: 'Foo',
                ref: {ns: 'a'}
            })
            .set({
                name: 'Foo',
                ref: {ns: ''}
            });
    });

    describe('Parent to Child', () => {
        let descriptor;

        beforeEach(() => {
            descriptor = di.lookupDescriptor('a.b.c.d.foo', { lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
        });

        it('should have found the descriptor', () => {
            should.exist(descriptor);
            descriptor.ref.ns.should.equals('');
        });

        describe('Without parent', () => {
            beforeEach(() => {
                di.removeDescriptor('foo');
                descriptor = di.lookupDescriptor('a.b.c.d.foo', { lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
            });

            it('should have found the descriptor', () => {
                should.exist(descriptor);
                descriptor.ref.ns.should.equals('a');
            });
        });
    });

    describe('Child to Parent', () => {
        let descriptor;

        beforeEach(() => {
            descriptor = di.lookupDescriptor('a.b.c.d.foo', { lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
        });

        it('should have found the descriptor', () => {
            should.exist(descriptor);
            descriptor.ref.ns.should.equals('a.b.c.d');
        });

        describe('Without child', () => {
            beforeEach(() => {
                di.removeDescriptor('a.b.c.d.foo');
                descriptor = di.lookupDescriptor('a.b.c.d.foo', { lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
            });

            it('should have found the descriptor', () => {
                should.exist(descriptor);
                descriptor.ref.ns.should.equals('a.b.c');
            });
        });
    });
});