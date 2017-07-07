import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('#register', () => {
    const di = new DI();
    let contract,
        inject = {propertyName: 'test', contractName: 'register.maz'};

    before(() => {
        di.register({
            ns: 'register',
            name: 'Foo',
            classRef: fixtures.Foo,
            inject: [inject]
        })
            .register({
                ns: 'register',
                name: 'maz',
                classRef: fixtures.Bar,
            });

        contract = di.getContract('register.foo');
    });

    it('should have created a contract', () => {
        should.exist(contract);
    });

    it('should have all properties', () => {
        contract.ns.should.equals('register');
        contract.name.should.equals('foo');
        contract.classRef.should.equals(fixtures.Foo);
        contract.inject.length.should.equals(1);
        contract.inject[0].should.eqls(inject);
    });
});