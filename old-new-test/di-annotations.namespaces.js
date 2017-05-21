import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI, DI_TYPES} from '../di';
import * as fixtures from './fixtures/annotations-ns';
import {validateContract} from './helpers';

let should = chai.should();

describe("DI - Annotation - Namespace", () => {
    let di, contracts, instance;

    beforeEach(() => {
        di = new DI('ns');
        contracts = di.getContracts('ns'); // Namespace is not required
    });

    it('should have a list of contracts', ()=> {
        contracts.should.exist;
        contracts.size.should.equals(3);
    });

    describe('#getContract without using namespace', ()=> {
        beforeEach(() => {
            instance = di.getInstance('Baz');
        });

        it('should have a correct contract', ()=> {
            let contract = di.getContractFor('Baz');
            contract.should.exist;
            validateContract(contract, 'baz', fixtures.Baz, true, ['foo', 'ns.$bar'], 'ns');

        });

        it('should have a foo instance', ()=> {
            instance.ns.foo.should.exist;
            instance.ns.foo.should.be.instanceof(fixtures.Foo);
        });

        it('should have a bar instance', ()=> {
            instance.ns.$bar.should.exist;
            instance.ns.$bar.should.be.instanceof(fixtures.Bar);
        });
    });

    describe('#getContract with a namespace', ()=> {
        beforeEach(() => {
            instance = di.getInstance('ns.Baz');
        });

        it('should have a correct contract', ()=> {
            let contract = di.getContractFor('ns.Baz');
            contract.should.exist;
            validateContract(contract, 'baz', fixtures.Baz, true, ['foo', 'ns.$bar'], 'ns');

        });

        it('should have a foo instance', ()=> {
            instance.ns.foo.should.exist;
            instance.ns.foo.should.be.instanceof(fixtures.Foo);
        });

        it('should have a bar instance', ()=> {
            instance.ns.$bar.should.exist;
            instance.ns.$bar.should.be.instanceof(fixtures.Bar);
        });
    });
});
