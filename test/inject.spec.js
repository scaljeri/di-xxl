import {DI, chai, should} from './helpers';
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
    })
});