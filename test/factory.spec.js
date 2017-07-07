import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Factory', () => {
    const di = new DI();
    let factory, instance;

    before(() => {
    });

    describe('Create instances', () => {
        before(() => {
            factory = di.getFactory('decorator.$foo');
            instance = factory();
        });

        it('should create instances', () => {
            should.exist(instance);
        });

        it('should create new/different instances', () => {
            instance.should.not.equals(factory());
        });

    });

    describe('without arguments', () => {
        before(() => {
            factory = di.getFactory('decorator.$foo');
            instance = factory();
        });

        it('should create instances', () => {
            should.exist(instance);
        });

        it('should have the correct type', () => {
            instance.should.be.instanceOf(fixtures.Foo);
        });

        it('should have received zero arguments', () => {
            instance.args.length.should.equals(0);
        });
    });

    describe('with base arguments', () => {
        before(() => {
            factory = di.getFactory('decorator.$foo', {params: [10]});
            instance = factory();
        });

        it('should create instances', () => {
            should.exist(instance);
        });

        it('should have the correct type', () => {
            instance.should.be.instanceOf(fixtures.Foo);
        });

        it('should have received 1 argument', () => {
            instance.args.length.should.equals(1);
            instance.args[0].should.equals(10);
        });
    });

    describe('with factory arguments', () => {
        before(() => {
            factory = di.getFactory('decorator.$foo', {params: [10]});
            instance = factory(11, 12);
        });

        it('should create instances', () => {
            should.exist(instance);
        });

        it('should have the correct type', () => {
            instance.should.be.instanceOf(fixtures.Foo);
        });

        it('should have received 1 argument', () => {
            instance.args.length.should.equals(2);
            instance.args[0].should.equals(11);
            instance.args[1].should.equals(12);
        });
    });
});