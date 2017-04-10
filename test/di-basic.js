import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI, DI_TYPES} from '../di';
import * as fixtures from './fixtures/basic';
import {validateContract} from './helpers';

let should = chai.should();

describe("DI - Annotation - basics", () => {
    let di, contract, instance;

    before(() => {
        di = new DI('basic');
        di.register('$foo', fixtures.Foo);
        di.register('$bar', fixtures.Bar, ['$foo']);
        di.register('$baz', fixtures.Baz, ['$foo'], {type: DI_TYPES.INJECT});
        di.register('$foo', fixtures.Foo, {type: DI_TYPES.INJECT});
    });

    describe('#getInstance - without deps', () => {
        beforeEach(() => {
            instance = di.getInstance('$foo', 11);
        });

        it('should have all settings extracted from @Injectable', () => {
            contract = di.getContractFor('$foo');
            contract.should.exist;
            validateContract(contract, '$foo', fixtures.Foo, true, [], 'basic');
        });

        it('should be the correct instance', () => {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Foo);
        });

        it('should have the correct init value', () => {
            instance.value.should.equals(11);
        })
    });
});

