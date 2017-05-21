import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI} from '../di';
import * as fixtures from './fixtures/basic';
import {validateContract} from './helpers';

let should = chai.should();

describe("DI - basics", () => {
    let di, contract, instance;

    before(() => {
        di = new DI('basic');
        di.register('$foo', fixtures.Foo);
        di.register('$bar', fixtures.Bar, ['$foo']);
        di.register('$qux', fixtures.Qux, ['$bar'], {inject: DI.ACTIONS.INSTANCE});
        di.register('$baz', fixtures.Baz, {inject: DI.ACTIONS.CONSTRUCTOR});
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
        });
    });

    describe('#getInstance - inject into instance ', () => {
        beforeEach(() => {
            instance = di.getInstance('$bar', 12);
        });

        it('should have all settings extracted from @Injectable', () => {
            contract = di.getContractFor('$bar');
            contract.should.exist;
            validateContract(contract, '$bar', fixtures.Bar, true, ['$foo'], 'basic');
        });

        it('should be the correct instance', () => {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Bar);
        });

        it('should have the correct init value', () => {
            instance.value.should.equals(12);
        });

        it('should have injected the dependency', ()=> {
            instance['basic'].$foo.should.be.instanceof(fixtures.Foo);
        });
    });

    describe('#getInstance - inject into instance (specified) ', () => {
        beforeEach(() => {
            instance = di.getInstance('$qux', 13);
        });

        it('should have all settings extracted from @Injectable', () => {
            contract = di.getContractFor('$qux');
            contract.should.exist;
            validateContract(contract, '$qux', fixtures.Qux, true, ['$bar'], 'basic');
        });

        it('should be the correct instance', () => {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Qux);
        });

        it('should have the correct init value', () => {
            instance.value.should.equals(13);
        });

        it('should have injected the dependency', ()=> {
            instance['basic'].$bar.should.be.instanceof(fixtures.Bar);
        });

        it('should have injected the dependencies of the dependencies', ()=> {
            instance['basic'].$bar['basic'].$foo.should.be.instanceof(fixtures.Foo);
        });
    });

    describe('#getInstance - inject into constructor', () => {
        beforeEach(() => {
            instance = di.getInstance('$baz');
        });

        it('should have all settings extracted from @Injectable', () => {
            contract = di.getContractFor('$baz');
            contract.should.exist;
            validateContract(contract, '$baz', fixtures.Baz, true, ['$bar'], 'basic');
        });

        it('should be the correct instance', () => {
            instance.should.exist;
            instance.should.be.instanceOf(fixtures.Baz);
        });

        it('should have injected the dependency', ()=> {
            instance.$bar.should.be.instanceof(fixtures.Bar);
        });

        it('should have injected the dependencies of the dependencies', ()=> {
            instance.$bar['basic'].$foo.should.be.instanceof(fixtures.Foo);
        });
    });
});

