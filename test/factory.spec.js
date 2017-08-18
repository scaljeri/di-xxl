import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Factory', () => {
    const di = new DI();
    let factory, instance;

    before(() => {
        di.set({
            name: 'foo',
            ns: 'factory',
            ref: fixtures.Foo,
            singleton: true
        })
            .set({
                name: 'bar',
                ns: 'factory',
                ref: fixtures.Bar,
                inject: [{name: 'factory.foo', factory: true, property: 'creator'}]
            });
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

    describe('Singletons', () => {
        let instance;
        beforeEach(() => {
            instance = di.get('factory.bar');
        });

        it('should create singletons', () => {
           instance.creator().should.eql(di.get('factory.foo'));
        });
    });

    describe('None existing', () => {
        beforeEach(() => {
            factory = DI.getFactory('factory.foo');
        });

        it('should return null', () => {
            should.not.exist(factory());
        })
    });
});