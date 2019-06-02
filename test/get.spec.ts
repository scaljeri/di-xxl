import {DI, chai, should, describe, it, before} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('DI - Decorators', () => {
    const di = new DI();
    let descriptor, instance;

    before(() => {
    });

    describe('Create instance', () => {
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

        describe('Foo - #mapxxxxxxx', () => {
            before(() => {
                di.setProjection({
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
                        descriptor = di.getDescriptor('decorator.$foo');
                    });

                    it('should not be altered', () => {
                        descriptor.inject[0].name.should.eqls('decorator.iService');
                    });
                });
            });
        });
    });
});
