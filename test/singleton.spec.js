import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Singletons', () => {
    const di = new DI();
    let instanceA, instanceB;

    before(() => {
    });

    describe('Without the `singleton` option', () => {
        before(() => {
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
        before(() => {
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
});