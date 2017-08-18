import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Functions - ACTIONS.INVOKE', () => {
    let di, response,
        inject = {property: 'test', name: 'register.maz'},
        myFunc = function () {
            return {args: arguments[0]};
        }

    beforeEach(() => {
        di = new DI();

        di.set({
            ns: 'register',
            name: 'Foo',
            ref: myFunc,
            inject: [inject],
            action: DI.ACTIONS.INVOKE
        })
            .set({
                ns: 'register',
                name: 'maz',
                ref: fixtures.Bar
            });

        response = di.get('register.a.b.c.Foo', {params: {a: 'b'}});

    });

    it('should have invoked the function', () => {
        should.exist(response);
    });

    it('should have used params', () => {
        should.exist(response.args);
        response.args.should.eqls({a: 'b'});
    });

    it('should have injected', () => {
        should.exist(response.test);
        response.test.should.be.instanceOf(fixtures.Bar)
    });

    describe('Without params', () => {
        beforeEach(() => {
            response = di.get('register.foo');
        });

        it('should have been called', () => {
            response.should.exist;
        });

        it('should have empty args', () => {
            should.not.exist(response.args);
        });
    });
});