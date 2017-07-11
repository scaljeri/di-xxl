import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Decorators', () => {
    const di = new DI();
    let contract;

    before(() => {
    });

    describe('Verify Contract', () => {
        describe('Foo', () => {
            before(() => {
                contract = di.getContract('decorator.$foo');
            });

            it('should exist', () => {
                should.exist(contract);
            });

            it('should have a namespace', () => {
                contract.ns.should.eqls('decorator');
            });

            it('should have a ref', () => {
                contract.ref.should.eqls(fixtures.Foo);
            });

            describe('property `inject`', () => {
                let inject, item;

                before(() => {
                    inject = contract.inject;
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
                contract = di.getContract('decorator.bar');
            });

            it('should exist', () => {
                should.exist(contract);
            });

            it('should have a namespace', () => {
                contract.ns.should.eqls('decorator');
            });

            it('should have a ref', () => {
                contract.ref.should.eqls(fixtures.Bar);
            });

            it('should have an empty inject array', () => {
                contract.inject.should.be.empty;
            });
        });
    });

    describe('Create instance', () => {
        let instance;

        describe('Foo', () => {
            before(() => {
                instance = di.get('decorator.$foo');
            });

            it('should exist', () => {
                should.exist(instance);
            });

            describe('Injectable', () => {
                it('should exist', () => {
                   instance.service.should.exist;
                });

                it('should the correct type', () => {
                    instance.service.should.eqls('decorator.iService');
                });
            });
        });

        describe('Foo - #map', () => {
            before(() => {
                di.connect({
                    'decorator.iService': 'decorator.Maz'
                });

                instance = di.get('decorator.$foo');
            });

            it('should exist', () => {
                should.exist(instance);
            });

            describe('Injectable', () => {
                it('should exist', () => {
                    instance.service.should.exist;
                });

                it('should the correct type', () => {
                    instance.service.should.be.instanceOf(fixtures.Maz);
                });

                describe('Verify Contract', () => {
                    before(() => {
                        contract = di.getContract('decorator.$foo');
                    });

                    it('should not be altered', () => {
                        contract.inject[0].contractName.should.eqls('decorator.iService');
                    });
                });
            });
        });
    });
});
