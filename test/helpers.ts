import chai = require('chai');
import assertArrays = require('chai-arrays');

import {beforeEach, describe, it, after, before} from "mocha";
import {DI} from '../src/di';

let should = chai.should();
chai.use(assertArrays);

export {DI, chai, should, beforeEach, describe, it, after, before};
