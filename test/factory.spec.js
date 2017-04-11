import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI} from '../di';
import * as fixtures from './fixtures/factory';
import {validateContract} from './helpers';

let should = chai.should();

describe("DI - FactoryFor", () => {
    let di, contract, instance;

    before(() => {
        di = new DI('factory');
        di.register('$foo', fixtures.Foo);
    });

    describe('Default factory', () => {
        beforeEach(() => {
            instance = di.getInstance('$fooFactory', 11);
        });

        it('should exist', () => {
            instance.should.exist;
        });

        it('should create Foo instances', ()=> {
           instance().should.be.instanceof(fixtures.Foo);
        });
    });
});

