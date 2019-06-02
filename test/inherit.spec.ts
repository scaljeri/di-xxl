import {DI, chai, should, describe, beforeEach, it} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Inherit', () => {
    let instance, di;

    describe('Property', () => {
        beforeEach(() => {
            di = new DI();
            di.set({name: 'inherit.glo', ref: {}, inherit: 'decorator.bar'});
            di.setProjection({'decorator.iService': 'decorator.Mooz'});

            instance = di.get('decorator.bar');
        });

        describe('One level deep', () => {
            it('should exist', () => {
                should.exist(instance.service);
            });

            it('should have the inherited service', () => {
                instance.service.should.be.instanceOf(fixtures.Mooz);
                instance.service.service.should.be.instanceOf(fixtures.Maz);
            });
        });

        describe('Two levels deep', () => {
            beforeEach(() => {
                instance = di.get('inherit.glo');
            });

            it('should have inherited from level 2', () => {
                instance.service.should.be.instanceof(fixtures.Mooz);
            });
        });
    });

    describe('Setter', () => {
        beforeEach(() => {
            di = new DI();

            instance = di.get('decorator.buzu');
        });

        it('should exist', () => {
            should.exist(instance.factory);
        });

        it('should have the inherited service', () => {
            const mooz = instance.factory();

            mooz.should.be.instanceOf(fixtures.Mooz);
            mooz.service.should.be.instanceOf(fixtures.Maz);
        });
    });
});
