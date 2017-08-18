import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('#remove', () => {
    let di;

    beforeEach(() => {
        di = new DI();

        DI.set({
            name: 'Foo',
            ns: 'remove',
            ref: fixtures.Foo
        })
            .set({name: 'maz', ref: fixtures.Bar, ns: 'remove'});

        DI.setProjection({'boo': 'remove.foo'});
    });

    it('should have a projection on DI', () => {
        DI.get('boo').should.exist;
        DI.getProjection('boo').should.equal('remove.foo');
    });

    it('should have a projection on the instance', () => {
        di.get('boo').should.exist;
        di.getProjection('boo').should.equal('remove.foo');
    });

    describe('Instance', () => {
        beforeEach(() => {
            di.removeProjection('boo');
        });

        it('should still exist on DI', () => {
            DI.get('boo').should.be.exist;
            DI.getProjection('boo').should.exist;
        });

        it('should have been deleted', () => {
            should.not.exist(di.getProjection('boo'));
        });
    });

    describe('Class', () => {
        beforeEach(() => {
            DI.removeProjection('boo')
        });

        it('should have been deleted', () => {
            should.not.exist(DI.getProjection('boo'));
            should.not.exist(DI.get('boo'));
        });

        it('should have been deleted on the instance', () => {
            should.not.exist(di.getProjection('boo'));
        });
    });
});