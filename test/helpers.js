export function validateContract(contract, name, classRef, append, params = [], ns = undefined) {
    contract.should.exist;
    contract.name.should.equals(name);
    contract.classRef.should.equals(classRef);
    contract.append.should.equals(append);

    if (contract.params) {
        contract.params.should.eql(params);
    }

    if (contract.ns) {
        contract.ns.should.equal(ns);
    }
}