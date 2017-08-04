import {DI, chai, should} from './helpers';

describe('Objects - ACTIONS.NONE', () => {
    const di = new DI();
    let obj,
        inject = {property: 'test', name: 'register.maz'},
        myObj = {x: 1},
        testRef = { x: 10 };

    before(() => {
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

        obj = di.get('register.a.b.c.Foo', {params: {a: 'b'}});

    });

    it('should exist', () => {
        should.exist(obj);
        obj.x.should.equals(1);
    });

    it('should have injected', () => {
        should.exist(obj.test);
        obj.test.should.eqls(testRef);
    });
});