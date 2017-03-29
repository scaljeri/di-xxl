const CONTRACTS = new Map();

function addContract(classRef) {

}
export function Injectable(...params) {
    return function decorator(target) {
        if (!target.__di) {
            target.__di = {};
        }

        target.__di.contractStr = params[0];
        target.__di.ns = params[1] || 'global';
    }
}

export function Inject(...contracts) {
    return function (target) {
        if (!target.__di) {
            target.__di = {};
        }

        target.__di.contracts = contracts;
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
     * @param {Object} [options] configuration
     *      @param {String} [options.injectPropertyName] list of contracts
     **/
    constructor(ns = 'global', options = {}) {
        if (typeof ns === 'object') {
            options = ns;
        }
        this._injectPropName = options.injectPropertyName || 'inject';

        this.reset();
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
    register(contractStr, classRef, params = [], options = {}) {
        let paramsOrigin = 'input';

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

        let contract = {
            classRef: classRef,
            name: contractStr,
            options: options,
            params: params
        };

        this.prepareContract(contract);

        if (options.augment) {
            this.augment(options);
        }


        if (params.length === 0 && classRef && options.autoDetect !== false) {
            params = params.length === 0 ? this.extractContracts(classRef) : params;
            paramsOrigin = 'auto';
        }

        if (options.augment === true) {
            classRef = this.augment(classRef, options);
        }

        this.contracts[contractStr] = {
            classRef: classRef
            , params: params
            , paramsOrigin: paramsOrigin
            , options: options || {}
        };

        // Prepare factory if not manually defined
        if (!options.factoryFor && !this.contracts[`${contractStr}Factory`]) {
            this.contracts[`${contractStr}Factory`] = {
                options: {
                    factoryFor: contractStr
                    , writable: options.writable
                },
                params: []
            };
        }

        return this;
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
        let instance = null
            , contract = this.contracts[contractStr];

        if (contract) {
            if (contract.options.singleton) {
                instance = this.getSingletonInstance(contractStr, params);
            }
            else //create a new instance every time
            {
                if (contract.options.factoryFor) {
                    instance = this.createFactory(contractStr, params);
                }
                else {
                    instance = this.createInstance(contractStr, params);
                }
            }

            if (Array.isArray(contract.options.augment)) {
                this.depCheck.push(contractStr);
                contract.options.augment.forEach((contractStr) => {
                    instance[contractStr] = this.getInstance(contractStr);
                });
                this.depCheck.pop();
            }
        }

        return instance;
    }

    /**
     * Determine if the provided input needs any additional information
     *
     * @private
     * @param contract
     */
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
        let baseParams
            , indexParams = 0
            , mergedParams = [];

        if (contract.paramsOrigin === 'auto') {   // Remove all non contract parameters
            baseParams = contract.params.map((param) => this.contracts[param] ? param : undefined);
        }
        else {
            baseParams = contract.params;
        }

        for (let index = 0; index < baseParams.length; index++) {
            if (baseParams[index] === undefined || (contract.options.writable && params[indexParams] !== undefined)) {
                mergedParams.push(params[indexParams++]);
            }
            else {
                mergedParams.push(baseParams[index]);

                if (contract.options.writable) {
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
    createInstance(contractStr, params) {
        let cr, instance
            , self = this
            , contract = this.contracts[contractStr];

        function Dependency() {
            cr.apply(this, self.createInstanceList(contractStr, params));
        }

        cr = contract.classRef;

        this.depCheck.push(contractStr);
        Dependency.prototype = cr.prototype;   // Fix instanceof
        instance = new Dependency();           // done
        this.depCheck.pop();

        return instance;
    }

    /** @private
     * Convert a list of contracts into a list of instances
     * A dependency list can contain arrays with dependencies too:
     *    ["depA", ["depB", "depC"], "depE"]
     * In this case, the constructor would, for example, look like this:
     *    function constructor(instance, array, instance) { .. }
     * */
    createInstanceList(contractStr, params) {
        let constParams = []
            , mergedParams = this.mergeParams(this.contracts[contractStr], params);

        mergedParams.forEach((item) => {
            if (Array.isArray(item)) {
                constParams.push(item.reduce(
                    (list, c) => {
                        list.push(this.contracts[c] ? this.getInstance(c) : c);
                        return list;
                    }, []));
            }
            else {
                constParams.push(this.createInstanceIfContract(item));
            }
        });

        return constParams;
    }

    /** @private
     *
     * Create or reuse a singleton instance
     */
    getSingletonInstance(contractStr, params) {
        let contract = this.contracts[contractStr]
            , mergedParams = this.mergeParams(contract, params);

        if (contract.instance === undefined || (params && params.length > 0)) {
            contract.params = mergedParams;
            contract.instance = this.createInstance(contractStr);
        }

        return contract.instance;
    }

    /** @private
     *
     * @param contract
     * @returns {*}
     */
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
    }

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
}


