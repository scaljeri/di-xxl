import chai from 'chai';
import * as fixtures from './fixtures/annotations';
import {beforeEach, describe, it} from "mocha";
import {DI} from '../di';

let should = chai.should();

describe("DI - Annotation", () => {
    let di;

    beforeEach(() => {
        di = new DI();
    });

    describe('#register', () => {
        it('should initialize without injection', () => {
            fixtures.Bar.__di.should.exist;
        });

    });
});
