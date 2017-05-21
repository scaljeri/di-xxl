import {DI} from './helpers';
import * as fixtures from './fixtures/modes';

describe('DI - Modes', () => {
    let di;
    let contract;

    describe('BUBBLING', () => {
        before(() => {
            di = new DI('a.b.c', {mode: DI.MODES.BUBBLING});
            contract = di.getContractFor('$xFoo');
        });

        it('should return the contract for ns `a.b.c`', () => {
            contract.classRef.should.eqls(fixtures.CFoo);
        });
    });

    describe('CAPTURING', () => {
        before(() => {
            di = new DI('a.b.c', {mode: DI.MODES.CAPTURING});
            contract = di.getContractFor('$xFoo');
        });

        it('should return the contract without the ns', () => {
            contract.classRef.should.eqls(fixtures.AFoo);
        });
    });
});
