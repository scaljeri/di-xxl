const CONTRACTS = new Map(),
    CONNECTIONS = new Map();

/*
 Examples
 @Injectable()
 @Injectable('$foo')
 @Injectable({
 name: '$foo'
 })
 @Injectable({
 name: '$foo',
 type: DI_TYPES.AUGMENT,
 params: ['$baz'],
 singleton: true,
 append: true        // how param inheritance works
 })
 @Injectable({
 name: '$foo',
 type: DI_TYPES.INJECT,
 params: ['$baz']
 })
 */
// NOTE: Get parent name: Object.getPrototypeOf(Bar.prototype.constructor).name
export function Injectable() {
    const settings = arguments[0] ? (typeof arguments[0] === 'string' ? {name: arguments[0]} : arguments[0]) : {};

    return function decorator(classRef) {
        let contract = Object.assign(CONTRACTS.get(classRef) || {inject: []}, settings);

        contract.classRef = classRef;

        if (!contract.name) { // class BarFoo {} --> { name: 'barFoo' }
            contract.name = classRef.name.charAt(0).toLowerCase() + classRef.name.substring(1);
        } else { // 'namespace.bar' --> { ns: 'namespace', name: 'bar'}
            const [ns, name] = splitContract(contract.name);
            contract.name = name;

            if (ns) {
                contract.ns = ns;
            }
        }

        if (contract.constructor === true && Object.keys(contract.inject).length === 0) {
            extractContracts(classRef).forEach(param => {
                contract.inject.push({contractName: param});
            });
        }

        CONTRACTS.set(fullNameFor(contract).toLowerCase(), contract);
    }
}

export function Inject(contractName) {
    return function decorator(classRef, argument, config) {
        let contract = CONTRACTS.get(classRef.constructor) || {inject: []};

        //contract.classRef = classRef;
        //let x = new classRef();
        contract.inject.push({propertyName: argument, contractName, config});

        console.log(classRef.constructor);
        CONTRACTS.set(classRef.constructor, contract);

        config.writable = true;
        return config;
    }
}

export class DI {
    static get DIRECTIONS() {
        return {
            PARENT_TO_CHILD: 1,
            CHILD_TO_PARENT: 2
        }
    }

    /**
     * DI makes classes accessible by a contract. Instances are created when requested and dependencies are injected into the constructor,
     * facilitating lazy initialization and loose coupling between classes.
     *
     * Basic usage:
     *
     *      class Bar {
     *          constructor($foo, val) { this.foo = $foo; this.val = val }
     *      }
     *
     *      class Foo {}
     *
     * Setup:
     *
     *     di.register('$bar', Bar);               // $bar         - is the name of the contract (can be anything),
     *                                             // Bar          - the class reference
     *     di.register('$foo', Foo);               // The order of registration is irrelevant (lazy initialization!)
     *
     * Usage:
     *
     *     let bar = di.getInstance('$bar', 10);   // bar instanceof Bar
     *     // bar.foo instanceOf Foo -> true
     *     // bar.val === 10
     *
     * @class DI
     * @constructor
     * @param {String} [namespace] optional namespace
     **/
    constructor(config = {}) {
        this.direction = (config.lookup || DI.DIRECTIONS.PARENT_TO_CHILD);
        this.config = config;
        this.connections = new Map();
    }

    static connect(list, connections = CONNECTIONS) {
        let key, map, ns, contractName;

        for (key in list) {
            connections.set(key.toLowerCase(), list[key].toLowerCase());
        }

        return this;
    }

    connect(list) {
        DI.connect(list, this.connections);
    }

    static getConnection(contractName, connections = CONNECTIONS) {
        return connections.get(contractName.toLowerCase());
    }

    getConnection(contractName) {
        return DI.getConnection(contractName, this.connections) || DI.getConnection(contractName)
    }

    /** Get all contracts
     *
     * @param {String} ns optional namespace. If the namespace is omitted, only contracts without a namespace are returned.
     * @returns {Map} contracts
     */
    getContracts(ns = null) {
        if (ns === null) {
            return CONTRACTS;
        } else {
            const output = new Map();

            CONTRACTS.forEach((value, key) => {
                if (value.ns === ns) {
                    output.set(key, value);
                }
            });

            return output;
        }
    }

    /**
     * Register a class by creating a contract. Use **getInstance** to obtain
     * an instance from this contract. The **params** parameter is a list of contracts or simple values.
     *
     * @method register
     * @chainable
     * @param {String} contract name of the contract
     * @param {Class} classRef the class bind to this contract
     * @param {Array} [params] list of constructor parameters. Only if a parameter is a string and matches a contract, it
     * will be replaced with the corresponding instance
     * @param {Object} [options] configuration
     *      @param {String} [options.singleton=false] create a new instance every time
     *      @param {String} [options.factoryFor] name of the contract for which it is a factory
     *      @param {String} [options.writable=false]  append (=false) or replace (=true) construtor arguments
     * @return {Object} this
     * @example
     App.di.registerType("$ajax", App.AJAX) ;
     App.di.registerType("$ajax", App.AJAX, [], { singleton: true }) ;
     App.di.registerType("$util", App.Util, ["compress", true, ["$wsql", "ls"] ], { singleton: true } ) ;
     **/
    register(name, classRef, params = [], options = {}) {
        const [ns, contractMame] = splitContract(name);

        if (Array.isArray(classRef)) {
            options = params;
            params = classRef;
            classRef = null;
        }
        else if (classRef && typeof classRef === 'object') {
            options = classRef;
            classRef = null;
        }

        if (!Array.isArray(params)) // no params defined
        {
            options = params;
            params = null;
        }

        let contract = {
            classRef, params,
            name: contractMame,
            ns: ns,
            singleton: options.singleton === true,
            append: options.append,
            inject: options.inject || DI.ACTIONS.INSTANCE
        };

        // --debug-start--
        if (!classRef) {
            if (!options.factoryFor) {
                console.warn(`#register(${contractStr}): 'classRef' is not defined`);
            }
        }
        else if (typeof(classRef) !== 'function') {
            console.warn(`#register(${contractStr}): 'classRef' is not a function`);
        }
        // --debug-end--

        Injectable(contract)(contract.classRef);

        // Prepare factory if not manually defined
        if (!contract.factoryFor && !this.getContractFor(`${contractMame}Factory`)) {
            contract = {
                classRef, params,
                name: `${contractMame}Factory`,
                ns: ns,
                factoryFor: contractMame,
                singleton: options.singleton === true,
                append: options.append
            };

            Injectable(contract)();
        }

        return this; // Chainable
    }

    /**
     * Removes a contract
     *
     * @param {String} contractStr name of the contract
     */
    remove(contractStr) {
        delete this.contracts[contractStr];
    }

    /**
     * A contract can be search for using two different modes, BUBBLING or CAPTURING.
     * For example, a contract like this `aaa.bbb.ccc.$foo` (namespace = aaa.bbb.ccc, contract name = $foo)
     * will be search in BUBBLING mode as follows
     *     aaa.bbb.ccc.$foo
     *     aaa.bbb.$foo
     *     aaa.$foo
     *     $foo
     *
     * In CAPTURING mode, it is the other way around
     *
     *     $foo
     *     aaa.$foo
     *     aaa.bbb.$foo
     *     aaa.bbb.ccc.$foo
     *
     * @param contractStr name of the contract (e.g. 'a.b.c.$foo')
     * @param traverse should the namespace be search if contract does not exist (default: true)
     * @returns {*}
     */
    static findContract(contractName) {
        let fullName, contract,
            isBubbling = (this.direction !== DI.DIRECTIONS.PARENT_TO_CHILD),
            ns = arguments[1],
            position = arguments[2];

        if (ns === undefined) {
            [ns, contractName] = splitContract(contractName.toLowerCase());
            ns = ns.split('.');
            position = isBubbling ? ns.length : 0;
        }

        fullName = `${(ns.slice(0, position).join('.'))}.${contractName}`
            .replace(/^\./, '');

        const map = this.getConnection(fullName);

        if (map) {
            [ns, contractName] = splitContract(map.toLowerCase());
            ns = ns.split('.');
            position = isBubbling ? ns.length : 0;

            fullName = `${(ns.slice(0, position).join('.'))}.${contractName}`
                .replace(/^\./, '');
        }

        contract = CONTRACTS.get(fullName);

        if (!contract && ns.length) {
            const nextPos = (position + (isBubbling ? -1 : 1));

            if (nextPos >= 0 && nextPos <= ns.length) {
                return this.findContract(contractName, ns, nextPos);
            }
        }

        return contract;
    }

    findContract() {
        return DI.findContract.apply(this, arguments)
    }

    static getContract(contractName) {
        return CONTRACTS.get(contractName.toLowerCase())
    }

    getContract(contractName) {
        return DI.getContract(contractName);
    }

    /**
     * Returns an instance for the given contract. Use <tt>params</tt> attribute to overwrite the default
     * parameters for this contract. If <tt>params</tt> is defined, the singleton will be (re)created and its
     * parameters are updated.
     *
     * @method getInstance
     * @param  {String} contract name
     * @param  {...*} [params] constructor parameters which, if defined, replaces its default arguments (see {{#crossLink "DI/register:method"}}{{/crossLink}} )
     * @return {Object} Class instance
     * @example
     App.di.register("ajax", ["rest"]) ;
     var ajax = App.di.getInstance("ajax") ;
     ajax = App.di.getInstance("ajax", "rest", true) ;
     **/
    getInstance(contractStr, config = {}) {
        let instance = contractStr
            , contract = contractStr.name ? contractStr : this.findContract(contractStr);


        if (contract) {
            if (contract.singleton) {
                if (!contract.instance) {
                    instance = contract.instance = this.createInstance(contract, config);
                } else {
                    instance = contract.instance;
                }
            }
            else //create a new instance every time
            {
                if (contract.factoryFor) {
                    instance = this.createFactory(contract, config);
                }
                else {
                    instance = this.createInstance(contract, config);
                }
            }
        }

        return instance;
    }

    /**
     * @private
     * @param contractStr
     * @param config
     * @returns {function()}
     */
    getFactory(contractName, config = {params: []}) {
        const contract = Object.assign({}, (this.findContract(contractName) || {}), config);

        return (...params) => {
            return this.getInstance(contractName, params.length ? Object.assign(contract, {params}) : contract);
        };
    }

    /**
     * @private
     * Returns a new instance of the class matched by the contract.
     *
     * @method createInstance
     * @param {string} contract - the contract name
     * @param {Array} params - list of contracts passed to the constructor. Each parameter which is not a string or
     * an unknown contract, is passed as-is to the constructor
     *
     * @returns {Object}
     * @example
     var storage = App.di.createInstance("data", ["compress", true, "websql"]) ;
     **/
    createInstance(contract, config = {}) {
        let deps = (config.deps || {}),
            instance, parentContract,
            parentFullName = fullNameFor(contract),
            localMap = config.map || {};

        // Make sure the original contract is not altered
        parentContract = Object.assign({map: {}, params: [], accept: [], reject: []}, contract, config);

        if (parentContract.classRef) {
            instance = Array.isArray(parentContract.params) ?
                new parentContract.classRef(...(parentContract.params || [])) : new parentContract.classRef(parentContract.params);

            deps[parentFullName] = {instance, contract: parentContract};
        }

        // Fix inject list
        if (parentContract.inject.length) {
            parentContract.inject.forEach(dep => {
                const contract = this.findContract((localMap[dep.contractName] || dep.contractName)),
                    fullName = fullNameFor(contract);

                if (parentContract.accept.length && !~parentContract.accept.indexOf(contract.role)) {
                    throw Error(`Contract '${fullName}' with role '${contract.role}' is not whitelisted by '${parentFullName}'`);
                } else if (parentContract.reject.length && ~parentContract.reject.indexOf(contract.role)) {
                    throw Error(`Contract '${fullName}' with role '${contract.role}' is blacklisted by '${parentFullName}'`);
                }

                instance[dep.propertyName] = contract ?
                    (deps[fullName] || (deps[fullName] = this.getInstance(contract, {deps}))) : dep.contractName;
            });
        }

        return instance;
    }
}


/* *** Private helpers ***/
// OBSOLETE??
/*
 function extractContracts(classRef) {
 let args = classRef.toString().match(/(?:(?:^function|constructor)[^\(]*\()([^\)]+)/);

 return args === null ? [] : args.slice(-1)[0].replace(/\s/g, '').split(',');
 }
 */
function splitContract(contractName) {
    const splitted = contractName.split(/\.|:/);
    const name = splitted.pop();

    return [(splitted.join('.') || ''), name];
}

function fullNameFor(contract) {
    return contract ? (typeof contract === 'string' ? contract : (contract.ns ? `${contract.ns}.` : '') + contract.name) : null;
}

