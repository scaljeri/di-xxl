import chai from 'chai';
import {DI} from '../di';
//import * as fixtures from './di-fixtures-inject';
import {beforeEach, describe, it} from "mocha";

let should = chai.should();
/*
function testContract(contract, match) {
    contract.should.exist;
    contract.classRef.should.equals(match.classRef);
    contract.params.should.eql(match.params);
    contract.paramsOrigin.should.equals(match.paramsOrigin);
    contract.options.should.eql(match.options);
}

describe("DI", () => {
  let di;

  beforeEach(() => {
    di = new DI();
  });

  describe('#register', () => {
    describe('Auto detect', () => {
      beforeEach(() => {
        di.register('$barSimple', fixtures.BarSimple);
        di.register('$barBasic', fixtures.BarBasic);
        di.register('$barComplex', fixtures.BarComplex);
        di.register('$foo', fixtures.Foo);
      });

      it('should have setup the contract', () => {
        let contract = di.contracts['$barSimple'];

        testContract(contract, {
          classRef: fixtures.BarSimple,
          options: {},
          params: [],
          paramsOrigin: 'auto'
        });
      });

      it('should initialize without injection', () => {
        di.getInstance('$barSimple').should.exist;
      });

    });
  });
});
*/
