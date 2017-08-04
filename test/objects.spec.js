import {DI, chai, should} from './helpers';

describe('Objects - ACTIONS.NONE', () => {
    let di,
        obj,
        inject = {property: 'test', name: 'register.maz'},
        myObj = {x: 1},
        testRef = {x: 10};


    beforeEach(() => {
        di = new DI();

        di.set({
            ns: 'register',
            name: 'Foo',
            ref: myObj,
            inject: [inject],
            action: DI.ACTIONS.NONE
        })
            .set({
                ns: 'register',
                name: 'maz',
                ref: testRef
            });
    });

    describe('Singleton', () => {
        beforeEach(() => {
            obj = di.get('register.a.b.c.Foo', {params: {a: 'b'}});
        });

        it('should exist', () => {
            should.exist(obj);
            obj.x.should.equals(1);
        });

        it('should have injected the params', () => {
            obj.a.should.equals('b');
        });

        it('should have injected', () => {
            should.exist(obj.test);
            obj.test.should.eqls(testRef);
        });

        it('should be a singleton', () => {
            obj.should.equals(di.get('register.Foo'));
        });
    });

    describe('Prototyple Inheritance', () => {
        beforeEach(() => {
            di.getDescriptor('register.Foo').singleton = false;

            obj = di.get('register.a.b.c.Foo');
        });

        it('should not be a singleton', () => {
            obj.should.not.equal(di.get('register.a.b.c.Foo'));
        })
    });
});