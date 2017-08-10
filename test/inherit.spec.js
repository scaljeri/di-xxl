import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Inherit', () => {
    let instance, di;

    describe('Property', () => {
        beforeEach(() => {
            di = new DI();
            di.setProjection({ 'decorator.iService': 'decorator.Mooz'});

            instance = di.get('decorator.bar');
        });

        it('should exist', () => {
            should.exist(instance.service);
        });

        it('should have the inherited service', () => {
            instance.service.should.be.instanceOf(fixtures.Mooz);
            instance.service.service.should.be.instanceOf(fixtures.Maz);
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