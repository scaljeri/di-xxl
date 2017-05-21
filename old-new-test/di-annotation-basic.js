import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI, DI_TYPES} from '../di';
import * as fixtures from './fixtures/annotations-basic';
import {validateContract} from './helpers';

let should = chai.should();

describe("DI - Annotation - basics", () => {
    let di, contracts, instance;

    beforeEach(() => {
        di = new DI();
        contracts = di.getContracts();
    });

    describe('@Injectable#getInstance - without contract name', () => {
        beforeEach(() => {
            instance = di.getInstance('Foo', 11);
        });

        it('should have all settings extracted from @Injectable', () => {
            let contract = contracts.get('foo');
            contract.should.exist;
            validateContract(contract, 'foo', fixtures.Foo, true);
        });

        it('should be the correct instance', ()=> {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Foo);
        });

        it('should have the correct init value', ()=> {
            instance.value.should.equals(11);
        })
    });

    describe('@Injectable#getInstance - with contract name', () => {
        beforeEach(() => {
            instance = di.getInstance('$bar', 12);
        });

        it('should have all settings extracted from @Injectable', () => {
            let contract = contracts.get('$bar');
            contract.should.exist;
            validateContract(contract, '$bar', fixtures.Bar, true);
        });

        it('should be the correct instance', ()=> {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Bar);
        });

        it('should have the correct init value', ()=> {
            instance.value.should.equals(12);
        })
    });

    describe('@Injectable#getInstance - with @Inject', () => {
        beforeEach(() => {
            instance = di.getInstance('Baz');
        });

        it('should have all settings extracted from the annotations', () => {
            let contract = contracts.get('baz');
            validateContract(contract, 'baz', fixtures.Baz, true, ['foo']);
        });

        it('should be the correct instance', ()=> {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Baz);
        });

        it('should have the injected dependency', ()=> {
            instance.fooo.should.be.instanceOf(fixtures.Foo);
        });
    });

    describe('@Injectable#getInstance - with params', () => {
        beforeEach(() => {
            instance = di.getInstance('Qux', 9);
        });

        it('should have a valid contract', () => {
            let contract = contracts.get('qux');
            validateContract(contract, 'qux', fixtures.Qux, true, ['baz']);
        });

        it('should be the correct instance', ()=> {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Qux);
        });

        it('should have the dependencies injected', ()=> {
            instance.baz.should.be.instanceOf(fixtures.Baz);
            instance.baz.fooo.should.be.instanceOf(fixtures.Foo);
        });
    });
});
