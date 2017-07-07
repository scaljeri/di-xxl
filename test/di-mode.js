import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/modes';

describe('Modes', () => {
    let di;
    let contract;

    describe('Parent 2 Child', () => {
        before(() => {
            di = new DI({lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
            contract = di.findContract('a.b.c.$xFoo');
        });

        it('should find a contract', () => {
            contract.classRef.should.eqls(fixtures.AFoo);
        });

        it('should find a contract in between', () => {
            contract = di.findContract('a.b.c.$yFoo');

            contract.ns.should.equals('a.b');
            contract.name.should.equals('$yfoo');
        });
    });

    describe('Child 2 Parent', () => {
        before(() => {
            di = new DI({lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
            contract = di.findContract('a.b.c.$xFoo');
        });

        it('should find a contract', () => {
            contract.classRef.should.eqls(fixtures.CFoo);
        });

        it('should find a contract in between', () => {
            contract = di.findContract('a.b.c.$yFoo');

            contract.ns.should.equals('a.b');
            contract.name.should.equals('$yfoo');
        })
    });
});
