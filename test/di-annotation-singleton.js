import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI, DI_TYPES} from '../di';
import * as fixtures from './fixtures/annotations-singleton';
import {validateContract} from './helpers';

let should = chai.should();


describe("DI - Annotation - basics", () => {
    let di, contracts, instance;

    beforeEach(() => {
        di = new DI('singleton');
        contracts = di.getContracts('singleton');
    });

    describe('@Injectable#getInstance - without contract name', () => {
        beforeEach(() => {
            instance = di.getInstance('Foo');
        });

        it('should always return the smae foo', ()=> {
            instance.should.eql(di.getInstance('Foo'));
        });

        it('should have all settings extracted from @Injectable', () => {
            let contract = di.getContractFor('foo');
            contract.should.exist;
            validateContract(contract, 'foo', fixtures.Foo, true);
        });

        it('should be the correct instance', () => {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Foo);
        });
    });
});
