import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Pure functions', () => {
    const di = new DI();
    let instance,
        inject = {propertyName: 'test', contractName: 'register.maz'},
        myFunc = function(){
            const x = {args: arguments[0]};
            return x;
            },
        ref = { x: 10 };

    before(() => {
        di.register({
            ns: 'register',
            name: 'Foo',
            ref: myFunc,
            inject: [inject],
            action: DI.ACTIONS.INVOKE
        })
            .register({
                ns: 'register',
                name: 'maz',
                asIs: true,
                ref: fixtures.Bar
            });

        instance = di.getInstance('register.a.b.c.Foo', {params: {a: 'b'}});

    });

    it('should have invoked the function', () => {
        should.exist(instance);
    });

    it('should have used params', () => {
        should.exist(instance.args);
        instance.args.should.eqls({a: 'b'});
    });

    it('should have injected', () => {
        should.exist(instance.test);
        instance.test.should.be.instanceOf(fixtures.Bar)
    });
});