import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Projections', () => {
    let di, instance;

    beforeEach(() => {
        di = new DI();
    });

    describe('Validate', () => {
        describe('Instance', () => {
            beforeEach(()  => {
                di.setProjection({'decorator.iService': 'decorator.Raz'});
            });

            it('should be null using DI', () => {
               should.not.exist(DI.getProjection('decorator.iService'))
            });

            it('should exist', () => {
               di.getProjection('decorator.iService').should.equals('decorator.Raz');
            });
        });

        describe('Class', () => {
            beforeEach(()  => {
                DI.setProjection({'decorator.iService': 'decorator.Xaz'});
            });

            it('should exist', () => {
                DI.getProjection('decorator.iService').should.equals('decorator.Xaz');
            });

            it('should exist on the instance', () => {
                di.getProjection('decorator.iService').should.equals('decorator.Xaz');
            });

            describe('Overwrite on instance', () => {
                beforeEach(() => {
                    di.setProjection({'decorator.iService': 'decorator.Zaz'});
                });

                it('should be unchanged', () => {
                    DI.getProjection('decorator.iService').should.equals('decorator.Xaz');
                });

                it('should be changed on the instance', () => {
                    di.getProjection('decorator.iService').should.equals('decorator.Zaz');
                });
            });

            after(() => {
                DI.removeProjection('decorator.iService');
            })
        });
    });

    describe('Instance', () => {
        describe('Initial', () => {
            beforeEach(() => {
                instance = di.get('decorator.$foo');
            });

            it('should not have projected the injectable', () => {
                instance.should.be.instanceof(fixtures.Foo);
                instance.service.should.equal('decorator.iService');
            });
        });

        describe('#setProjection', () => {
            beforeEach(() => {
                di.setProjection({'decorator.iService': 'decorator.Maz'});
                instance = di.get('decorator.$foo')
            });

            it('should have projected the injectable', () => {
                instance.service.should.be.instanceOf(fixtures.Maz);
            });

            describe('Updated', () => {
                beforeEach(() => {
                    di.setProjection({'decorator.iService': 'decorator.mode'});
                    instance = di.get('decorator.$foo')
                });

                it('should have projected the injectable', () => {
                    instance.service.should.be.instanceOf(fixtures.Baz);
                });

            });

            describe('#removeProjection', () => {
                beforeEach(() => {
                    di.removeProjection('decorator.iService');
                    instance = di.get('decorator.$foo')
                });

                it('should not have projected the injectable', () => {
                    instance.service.should.equal('decorator.iService');
                });
            });
        });
    });
});