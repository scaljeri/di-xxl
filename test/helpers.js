import chai from 'chai';
import assertArrays from 'chai-arrays';
import {beforeEach, describe, it} from "mocha";
import {DI} from '../dist/di';

let should = chai.should();
chai.use(assertArrays);

export {DI, chai, should, beforeEach, describe, it};