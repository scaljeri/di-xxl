import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('#remove', () => {
    const di = new DI();

    before(() => {
        di.set({
            name: 'Foo',
            ns: 'remove',
            ref: fixtures.Foo
        })
            .set({ name: 'maz', ref: fixtures.Bar, ns: 'remove'});

        di.removeDescriptor('Foo', 'remove');
        DI.removeDescriptor('remove.maz')
    });

    it('should have removed the descriptor using the DI instance', () => {
        should.not.exist(DI.get('remove.Foo'));
    });

    it('should have removed the descriptor using DI', () => {
        should.not.exist(DI.get('remove.maz'));
    });
});