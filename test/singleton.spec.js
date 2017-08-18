import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Singletons', () => {
    let di, instanceA, instanceB;

    beforeEach(() => {
        di = new DI();
    });

    describe('Without the `singleton` option', () => {
        beforeEach(() => {
            instanceA = di.get('decorator.$foo');
            instanceB = di.get('decorator.$foo');
        });

        it('should create different instance of the same type', () => {
            instanceA.should.be.instanceOf(fixtures.Foo);
            instanceB.should.be.instanceOf(fixtures.Foo);
        });

        it('should not be identical', () => {
            instanceA.should.not.equals(instanceB);
        });
    });

    describe('With the `singleton` option', () => {
        beforeEach(() => {
            instanceA = di.get('decorator.maz');
            instanceB = di.get('decorator.maz');
        });

        it('should create different instance of the same type', () => {
            instanceA.should.be.instanceOf(fixtures.Maz);
            instanceB.should.be.instanceOf(fixtures.Maz);
        });

        it('should not be identical', () => {
            instanceA.should.equals(instanceB);
        });
    });

    describe('With arguments', () => {
        beforeEach(() => {
            const descriptor = {
               name: 'xux',
               ref: (a,b,c) => ({args: [a,b,c]}),
               singleton: true,
               params: [1,2,3],
               action: DI.ACTIONS.INVOKE
            };
            di.set(descriptor);
        });

       it('should have used default params', () => {
           di.get('xux').should.eql({args: [1,2,3]});
       });

       it('should ignore new arguments', () => {
           const singleton = di.get('xux', {params: [5,6,7]});
           di.get('xux', {params: [8,9,10]}).args.should.eql([5,6,7]);
           singleton.should.equals(di.get('xux', {params: [8,9,10]}));
       })
    });
});