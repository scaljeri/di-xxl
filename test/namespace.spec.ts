import {DI, chai, should, describe, beforeEach, it} from './helpers';

describe('Objects - ACTIONS.NONE', () => {
    let di;

    beforeEach(() => {
        di = new DI();

        di.set({
            name: 'a.b.c.d.Foo',
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
            descriptor = di.lookupDescriptor('a.b.c.d.foo', {lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
        });

        it('should have found the descriptor', () => {
            should.exist(descriptor);
            descriptor.ref.ns.should.equals('');
        });

        describe('Without parent', () => {
            beforeEach(() => {
                di.removeDescriptor('foo');
                descriptor = di.lookupDescriptor('a.b.c.d.foo', {lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
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
            descriptor = di.lookupDescriptor('a.b.c.d.foo', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
        });

        it('should have found the descriptor', () => {
            should.exist(descriptor);
            descriptor.ref.ns.should.equals('a.b.c.d');
        });

        describe('Without child', () => {
            beforeEach(() => {
                di.removeDescriptor('a.b.c.d.foo');
                descriptor = di.lookupDescriptor('a.b.c.d.foo', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
            });

            it('should have found the descriptor', () => {
                should.exist(descriptor);
                descriptor.ref.ns.should.equals('a.b.c');
            });
        });
    });

    describe('Instances', () => {
        it('should find the exact match', () => {
            di.get('a.b.c.d.foo').ns.should.equal('a.b.c.d');
        });

        it('should lookup the main instance (PARENT_TO_CHILD)', () => {
            di.get('a.b.c.d.e.foo').should.eql({ns: ''});
        });

        it('should lookup the main instance (CHILD_TO_PARENT', () => {
            di.get('a.b.c.d.e.foo', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT}).should.eql({ns: 'a.b.c.d'});
        });
    });
});
