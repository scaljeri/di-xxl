const CONTRACTS = new Map();

export const DI_TYPES = {
    INJECT: 1,  // Inject as constructor arguments
    AUGMENT: 2  // Augment instance with injectables
};

function extractContracts(classRef) {
    let args = classRef.toString().match(/(?:(?:^function|constructor)[^\(]*\()([^\)]+)/);

    return args === null ? [] : args.slice(-1)[0].replace(/\s/g, '').split(',');
}

function splitContract(name) {
    return ((name + '') || '').match(/^(?:([^.:]+)[.:])?(.*)$/).splice(1, 3);
}

function createName(contract) {
    return (contract.ns ? `${contract.ns}.` : '') + contract.name;
}

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
export function Injectable() {
    const contract = arguments[0] ? (typeof arguments[0] === 'string' ? {name: arguments[0]} : arguments[0]) : {};

    return function decorator(target) {
        contract.classRef = target;

        if (!contract.name) {
            contract.name = target.name.charAt(0).toLowerCase() + target.name.substring(1);
        } else {
            const [ns, name] = splitContract(contract.name);
            if (ns) {
                contract.ns = ns;
                contract.name = name;
            }
        }

        if (contract.append === undefined) {
            contract.append = true;
        }

        if (contract.type === DI_TYPES.INJECT && !contract.params) {
            contract.params = extractContracts(target);
        }

        CONTRACTS.set(createName(contract).toLowerCase(), contract);
    }
}

export class DI {
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
    constructor(ns = null) {
        this._ns = ns;
        this.depCheck = [];
    }

    get ns() {
        return this._ns;
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
        const [ns, contractMame] = this.splitContract(name);

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
            params = [];
        }

        const contract = { classRef, params,
            name: contractMame,
            ns: ns,
            singleton: options.singleton === true,
            append: options.append
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

        return this;


        // TODO factoryFor

        // Prepare factory if not manually defined
        /*
        if (!options.factoryFor && !this.contracts[`${contractStr}Factory`]) {
            this.contracts[`${contractStr}Factory`] = {
                options: {
                    factoryFor: contractStr
                    , writable: options.writable
                },
                params: []
            };
        }

        return this; // Chainable
        */
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
     * Removes all contracts
     */
    reset() {
        /** @private
         *  Used to check for circular dependencies
         * @type {Array}
         */
        this.depCheck = [];

        /**
         * @private
         * Used to store all the registered contracts
         * @type {{}}
         */
        this.contracts = {};
    }

    getContractFor(contractName, ns = null) {
        if (!ns) {
            [ns, contractName] = splitContract(contractName);

            if (!ns) {
                ns = this.ns;
            }
        }

        contractName = (ns ? `${ns}.` : '') + contractName;

        return CONTRACTS.get(contractName.toLowerCase());
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
    getInstance(contractStr, ...params) {
        let instance = contractStr
            , contract = this.getContractFor(contractStr);

        if (contract) {
            if (contract.singleton) {
                instance = this.getSingletonInstance(contract, params);
            }
            else //create a new instance every time
            {
                if (contract.factoryFor) {
                    instance = this.createFactory(contract, params);
                }
                else {
                    instance = this.createInstance(contract, params);
                }
            }

            /*
             if (Array.isArray(contract.options.augment)) {
             this.depCheck.push(contractStr);
             contract.options.augment.forEach((contractStr) => {
             instance[contractStr] = this.getInstance(contractStr);
             });
             this.depCheck.pop();
             } */
        }

        return instance;
    }

    splitContract(contractName) {
        const [ns, name] = ((contractName + '') || '').match(/^(?:([^.:]+)[.:])?(.*)$/).splice(1, 3);
        return [(ns || this.ns), name];
    }

    /**
     * Determine if the provided input needs any additional information
     *
     * @private
     * @param contract
     */
    // TODO: Remove this
    prepareContract(contract) {
        let options = contract.options
            , classRefStr = contract.classRef.toString();

        // `params` is a list of constructor arguments
        if (!contract.params) {
            // Check if there is an injectable list
            if (!options.inject && options.autodetect !== false) {
                options.inject = this.extractInjectParams(classRefStr);
            }
        }

        // --debug-start--
        if (options.inject && options.augment) {
            console.warn(`#register(${contractStr}): the 'inject' setting will be used instead of 'augment'`);
        }
        // --debug-end--


        // Keep it simple; using both is not allowed
        if (!options.inject && options.augment) {
            contract.classRef = this.augment(classRef, classRefStr);
        }
    }

    /**
     * @private
     * @param contractStr
     * @param initialParams
     * @returns {function()}
     */
    createFactory(contractStr, initialParams) {
        let contract = this.contracts[contractStr]
            , factoryContract = {
            options: contract.options
            , params: this.mergeParams(contract, initialParams)
        };

        return (...params) => {
            return this.getInstance(factoryContract.options.factoryFor, ...this.mergeParams(factoryContract, params));
        };
    }

    /**
     * Merge the params with the ones from the contract based on the `writable` property. The first
     * step is to fix auto-determined parameters:
     *
     *     Auto determined parameters are parameters obtained from inspecting the class reference
     *
     * Each non contract string inside the contract params is set to `undefined`
     *
     * In the next step the parameters are merged. If `writable`, each element from `params` which is not `undefined`
     * replaced a contract parameter.
     *
     *     contract.params: [undefined, '$bar', '$foo', undefined]
     *     params: [1, '$baz']
     *     output --> [1, '$baz', '$foo', undefined]
     *
     * If the contract is not writable, `params` only replaces `undefined` contract parameters. The remaining
     * `params` are appended.
     *
     *     contract.params: [undefined, '$bar, '$foo', undefined]
     *     params: [1, '$baz', 10]
     *     output --> [1, '$bar', '$foo', '$baz, 10]
     *
     *
     * @private
     * @param contract
     * @param params
     */
    mergeParams(contract, params = []) {
        let baseParams = contract.params || []
            , indexParams = 0
            , mergedParams = [];

        // If the params are extracted from the constructor function, the non-contract arguments
        // need to be removed, because they are just argument names
        if (contract.type === DI_TYPES.INJECT) {
            baseParams = contract.params.map(param => this.getContractFor(param) ? param : undefined);
        }

        for (let index = 0; index < baseParams.length; index++) {
            if (baseParams[index] === undefined || (!contract.append && params[indexParams] !== undefined)) {
                mergedParams.push(params[indexParams++]);
            }
            else {
                mergedParams.push(baseParams[index]);

                if (!contract.append) {
                    indexParams++;
                }
            }
        }

        return mergedParams.concat(params.slice(indexParams));
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
    createInstance(contract, params = []) {
        //const instance = Reflect.construct(contract.classRef, this.createInstanceList(contract, params));
        let instance;

        if (contract.type === DI_TYPES.INJECT) {
            // When dependencies are injected into the constructor
            // circular dependencies cannot exist
            this.depCheck.push(contract.name);
            params = this.createInstanceList(this.mergeParams(contract, params)).reduce((list, item)=> {
                list.push(item.instance);
                return list;
            }, []);
            instance = new contract.classRef(...params);
            this.depCheck.pop();

        } else {
            // TODO: merge params with defaults
            instance = new contract.classRef(...params);
            this.createInstanceList(contract.params).forEach(injectable => {
                if (injectable.ns) {
                    if (!instance[injectable.ns]) {
                        instance[injectable.ns] = {};
                    }
                    instance[injectable.ns][injectable.name] = injectable.instance;
                } else {
                    instance[injectable.name] = injectable.instance;
                }
            });
        }

        return instance;
    }

    getInjectablesdFor(contract) {
        const proto = {};

        (contract.inject || []).forEach(dep => {
            const [ns, name] = this.splitContract(dep);
            const instance = this.getInstance(dep);

            if (ns) {
                if (!proto[ns]) {
                    proto[ns] = {};
                }

                proto[ns][name] = instance;
            } else {
                proto[name] = instance;
            }
        });

        return proto;
    }

    /** @private
     * Convert a list of contracts into a list of instances
     * A dependency list can contain arrays with dependencies too:
     *    ["depA", ["depB", "depC"], "depE"]
     * In this case, the constructor would, for example, look like this:
     *    function constructor(instance, array, instance) { .. }
     * */
    createInstanceList(params = []) {
        let instances = [];

        params.forEach((item) => {
            if (Array.isArray(item)) {
                instances.push(item.reduce(
                    (list, c) => {
                        let [ns, name] = this.splitContract(c);
                        list.push({ns: (ns || this.ns), name, instance: this.getInstance(this.getContractFor(c))});
                        return list;
                    }, []));
            }
            else {
                let [ns, name] = this.splitContract(item);
                instances.push({ns: (ns || this.ns), name, instance: this.getInstance(item)});
            }
        });

        return instances;
    }

    /** @private
     *
     * Create or reuse a singleton instance
     */
    getSingletonInstance(contract, params) {
        const mergedParams = this.mergeParams(contract, params);

        if (contract.instance === undefined || (params && params.length > 0)) {
            contract.params = mergedParams;
            contract.instance = this.createInstance(contract);
        }

        return contract.instance;
    }

    /** @private
     *
     * @param contract
     * @returns {*}
     */
    // TODO: Remove this but the error is still needed!
    /*
    createInstanceIfContract(contractStr) {                                     // is a contract
        let problemContract
            , constParam = contractStr;

        if (typeof(contractStr) === 'string' && this.contracts[contractStr])   // is 'contract' just a contructor parameter or a contract?
        {
            if (this.depCheck.indexOf(contractStr) === -1)                     // check for circular dependency
            {
                constParam = this.getInstance(contractStr);                    // create the instance
                this.depCheck.pop();                                           // done, remove dependency from the list
            }
            else { // circular dependency detected!! --> STOP, someone did something stupid -> fix needed!!
                problemContract = this.depCheck[0];
                this.depCheck.length = 0;                                      // cleanup
                throw Error("Circular dependency detected for contract " + problemContract);
            }
        }

        return constParam;
    } */

    /*
    extractContracts(classRef) {
        let args = classRef.toString().match(/(?:(?:^function|constructor)[^\(]*\()([^\)]+)/);

        return args === null ? [] : args.slice(-1)[0].replace(/\s/g, '').split(',');
    }

    augment(classRef, options) {
        let di = this
            , newClassRef = classRef
            , contractList = classRef.toString().match(/@inject\s*:*\s*([^\n]+)/);

        if (contractList) {
            options.augment = contractList[1].split(/,\s+|\s+?/);
        }
        else {
            let className = classRef.toString().match(/\s([^(]+)/)[1];
            newClassRef = new Function('return function ' + className + '(){ function _classCallCheck() {}; return ' + classRef.toString() + '.apply(this, arguments);}')();
            newClassRef.prototype = Object.create(classRef.prototype); // Fix instanceof

            Object.getOwnPropertyNames(classRef.prototype).forEach((name) => {
                if (name !== 'constructor') {
                    let functionArgs = classRef.prototype[name].toString().match(/\(([^)]+)/)[1].split(/,\s?/);

                    newClassRef.prototype[name] = function () {
                        let index = 0
                            , contracts = []
                            , contract = true
                            , inputArgs = Array.prototype.slice.call(arguments);

                        while (contract) {
                            contract = di.getInstance(functionArgs[index++]);

                            if (contract) {
                                contracts.push(contract);
                            }
                        }

                        return classRef.prototype[name].apply(this, contracts.concat(inputArgs));
                    }
                }
            });
        }

        return newClassRef;
    }
    */
}


