import {DI, chai, should, describe, beforeEach, it, before} from './helpers';
import * as fixtures from './fixtures/modes';

describe('Modes', () => {
    let di;
    let descriptor;

    describe('Parent 2 Child', () => {
        before(() => {
            di = new DI({lookup: DI.DIRECTIONS.PARENT_TO_CHILD});
            descriptor = DI.lookupDescriptor('$xFoo', 'a.b.c');
        });

        it('should find a contract', () => {
            descriptor.ref.should.eqls(fixtures.AFoo);
        });

        it('should find a contract in between', () => {
            descriptor = di.lookupDescriptor('a.b.c.$yFoo');

            descriptor.ns.should.equals('a.b');
            descriptor.name.should.equals('$yfoo');
        });
    });

    describe('Child 2 Parent', () => {
        before(() => {
            di = new DI({lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
            descriptor = di.lookupDescriptor('a.b.c.$xFoo');
        });

        it('should find a contract', () => {
            descriptor.ref.should.eqls(fixtures.CFoo);
        });

        it('should find a contract in between', () => {
            descriptor = di.lookupDescriptor('a.b.c.$yFoo');

            descriptor.ns.should.equals('a.b');
            descriptor.name.should.equals('$yfoo');
        })
    });
});
