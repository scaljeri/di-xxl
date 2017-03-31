import chai from 'chai';
import {beforeEach, describe, it} from "mocha";
import {DI} from '../di';
import * as fixstures from './fixtures/annotations';

let should = chai.should();

describe("DI - Annotation", () => {
    let di, contracts;

    beforeEach(() => {
        di = new DI();
        contracts = di.getContracts();
    });

    it('should have stored the annotated classed', () => {
        contracts.size.should.equals(3);
    });

    it('should have all settings extracted from @Injectable', () => {
        let contract = contracts.get('$foo');
        contract.should.exist;
        contract.options.should.eql({});

        contract = contracts.get('test:$bar');
        contract.should.exist;
        contract.options.should.eql({singleton: true});
    });

    it('should have all settings extracted from @Inject', () => {
        contracts.get('$foo').inject.should.eql(['test:$bar', 'test:$baz']);
        contracts.get('test:$bar').inject.should.eql(['test:$baz']);
    });

    describe('#getInstance', () => {
        let bar, baz, foo;

        beforeEach(() => {
            foo = di.getInstance('$foo');
        });

        describe('With no namespace', () => {
            it('should have created a Foo instance', () => {
                foo.should.exist;
            });

            it('should have injected its foo\'s dependencies', () => {
                foo.test.$bar.should.exist;
                foo.test.$baz.should.exist;

                foo.test.$bar.should.be.instanceOf(fixtures.Bar);
                foo.test.$baz.should.be.instanceOf(fixtures.Baz);
            });
        })
    });
});
