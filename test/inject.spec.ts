import {DI, chai, should, describe, beforeEach, it} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Inject', () => {
    let instance;

    describe('Using setter', () => {
        beforeEach(() => {
            instance = DI.get('decorator.mooz');
        });

        it('should inject using a setter', () => {
            instance.service.should.be.instanceOf(fixtures.Maz);
        });
    });

    describe('Factory injection', () => {
        beforeEach(() => {
            instance = DI.get('decorator.Wooz');
        });

        it('should exist', () => {
            should.exist(instance.factory);
        });

        it('should produce instances', () => {
            instance.factory().should.be.instanceOf(fixtures.Mooz);
            instance.factory().service.should.be.instanceOf(fixtures.Maz);
        });
    });
});
