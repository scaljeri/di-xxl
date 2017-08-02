import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Decorators', () => {
    const di = new DI();
    let descriptor, descriptorComp;

    before(() => {
    });

    describe('Verify Contract', () => {
        before(() => {
            descriptor = di.getDescriptor('decorator.$foo');
            descriptorComp = di.getDescriptor('$foo', 'decorator');
        });

        it('should exist', () => {
            should.exist(descriptor);
        });

        it('should both be equal', () => {
            descriptor.should.eql(descriptorComp);
        });

        it('should have a namespace', () => {
            descriptor.ns.should.eqls('decorator');
        });

        it('should have a ref', () => {
            descriptor.ref.should.eqls(fixtures.Foo);
        });

        describe('property `inject`', () => {
            let inject, item;

            before(() => {
                inject = descriptor.inject;
            });

            it('should exist', () => {
                should.exist(inject);
            });

            it('should not be empty', () => {
                inject.should.be.array();
                inject.should.ofSize(1);
            });

            it('should hold a configuration', () => {
                item = inject[0];

                item.propertyName.should.equals('service');
                item.contractName.should.equals('decorator.iService');
                item.config.configurable.should.not.be.ok;
                item.config.enumerable.should.be.ok;
            });
        });
    });

    describe('Bar', () => {
        before(() => {
            descriptor = di.getDescriptor('decorator.bar');
        });

        it('should exist', () => {
            should.exist(descriptor);
        });

        it('should have a namespace', () => {
            descriptor.ns.should.eqls('decorator');
        });

        it('should have a ref', () => {
            descriptor.ref.should.eqls(fixtures.Bar);
        });

        it('should have an empty inject array', () => {
            descriptor.inject.should.be.empty;
        });
    });
});
