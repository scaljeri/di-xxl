import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('#register', () => {
    const di = new DI();
    let contract,
        inject = {propertyName: 'test', contractName: 'register.maz'};

    before(() => {
        di.set({ name: 'Foo',
            ns: 'register',
            ref: fixtures.Foo,
            inject: [inject]
        })
            .set({
                ns: 'register',
                name: 'maz',
                ref: fixtures.Bar,
            });

        contract = di.getDescriptor('foo', 'register');
    });

    it('should have created a contract', () => {
        should.exist(contract);
    });

    it('should have all properties', () => {
        contract.ns.should.equals('register');
        contract.name.should.equals('foo');
        contract.ref.should.equals(fixtures.Foo);
        contract.inject.length.should.equals(1);
        contract.inject[0].should.eqls(inject);
    });
});