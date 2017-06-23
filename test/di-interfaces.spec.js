import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/interfaces';

describe.only('DI - Decorators', () => {
    const di = new DI('decorator');
    let contract;

    before(() => {
    });

    describe('Verify Contract', () => {
        describe('Foo', () => {
            before(() => {
                contract = di.getContractFor('$foo');
            });

            it('should exist', () => {
                should.exist(contract);
            });

            it('should have a namespace', () => {
                contract.ns.should.eqls('decorator');
            });

            it('should have a classRef', () => {
                contract.classRef.should.eqls(fixtures.Foo);
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

                    item.propertyName.should.eqls('service');
                    item.contractName.should.eqls('iService');
                    item.config.configurable.should.not.be.ok;
                    item.config.enumerable.should.be.ok;
                });
            });
        });

        describe('Bar', () => {
            before(() => {
                contract = di.getContractFor('bar');
            });

            it('should exist', () => {
                should.exist(contract);
            });

            it('should have a namespace', () => {
                contract.ns.should.eqls('decorator');
            });

            it('should have a classRef', () => {
                contract.classRef.should.eqls(fixtures.Bar);
            });

            it('should have an empty inject array', ()=> {
                contract.inject.should.be.empty;
            });
        });
    });

    describe.only('Create instance', () => {
        let instance;

        describe.only('Foo - #map', () => {
            before(()=> {
                //let x = new fixtures.Foo({$model: 10});
                di.map({
                    iService: 'Maz'
                });

                instance = di.getInstance('$foo');
            });

            it.only('should exist', ()=> {
               should.exist(instance);
            });

            it('should have an injectable', ()=> {
                instance.service.should.exist;
            })
        });

        describe('Foo - #map', () => {
            before(()=> {
                let x = new fixtures.Foo({$model: 10});
                instance = di.getInstance('$foo');
                di.map({
                    iService: 'Maz'
                });
            });

            it('should exist', ()=> {
                should.exist(instance);
            });

            it('should have an injectable', ()=> {
                instance.service.should.exist;
            })
        });
    });
});
