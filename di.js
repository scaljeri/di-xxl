const DESCRIPTORS = new Map(),
    PROJECTIONS = new Map();

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

    return function decorator(ref) {
        let contract = Object.assign(DESCRIPTORS.get(ref) || {inject: []}, settings);
        DESCRIPTORS.delete(ref); // Needed because a class can be registered multiple times

        contract.ref = ref;

        if (!contract.name) { // class BarFoo {} --> { name: 'barFoo' }
            contract.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        } else { // 'namespace.bar' --> { ns: 'namespace', name: 'bar'}
            const [ns, name] = splitContract(contract.name);
            contract.name = name.toLowerCase();

            if (ns) {
                contract.ns = ns.toLowerCase();
            }
        }

        if (contract.constructor === true && Object.keys(contract.inject).length === 0) {
            extractContracts(ref).forEach(param => {
                contract.inject.push({contractName: param});
            });
        }

        DESCRIPTORS.set(fullNameFor(contract).toLowerCase(), contract);
    }
}

export function Inject(contractName) {
    return function decorator(ref, argument, config) {
        let contract = DESCRIPTORS.get(ref.constructor) || {inject: []};

        contract.inject.push({propertyName: argument, contractName, config});

        DESCRIPTORS.set(ref.constructor, contract);

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

    static get ACTIONS() {
        return {
            CREATE: 0,
            INVOKE: 1,
            NONE: 2
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
     *     let bar = di.get('$bar', 10);   // bar instanceof Bar
     *     // bar.foo instanceOf Foo -> true
     *     // bar.val === 10
     *
     * @class DI
     * @constructor
     * @param {String} [namespace] optional namespace
     **/
    constructor(config = {}) {
        this.lookup = (config.lookup || DI.DIRECTIONS.PARENT_TO_CHILD);
        this.config = config;

        this.projections = new Map();
        this.descriptors = new Map();
    }

    getDescriptor(name, ns) {
        const fullName = (ns ? `${ns}.` : '') + name;

        return this.descriptors.get(fullName) || DI.getDescriptor(fullName);
    }

    lookupDescriptor(fullName, config) {
        return DI.lookupDescriptor.call(this, fullName, config);
    }

    static getDescriptor(name, ns) {
        return DESCRIPTORS.get((ns ? `${ns}.` : '') + name);
    }

    static lookupDescriptor(fullName, config = {}) {
        const settings = Object.assign({}, config, {name: fullName});
        settings.lookup = this.lookup || DI.DIRECTIONS.PARENT_TO_CHILD;

        let descriptor = lookup(settings,
            fullName => {
                return this.getDescriptor(fullName);
            },
            fullName => {
                return this.getProjection(fullName);
            }
        );

        return descriptor;
    }

    getProjection(name, ns) {
        return this.projections.get((ns ? `${ns}.` : '') + name);
    }

    static get(fullName, config = {}) {
        const descriptor = typeof fullName === 'string' ? this.lookupDescriptor(fullName, config) : fullName;

        if (descriptor.singleton && descriptor.instance) {
            return descriptor.instance;
        } else {
            return createInstance.call(this, descriptor, config);
        }

        /*
        let result = fullName
            , descriptor = fullName.name ? fullName : this.find({name: fullName}, store);

        if (descriptor) {
            if (descriptor.singleton) {
                if (!descriptor.instance) {
                    result = descriptor.instance = this.createInstance(descriptor, config);
                } else {
                    result = descriptor.instance;
                }
            }
            else
            {
                result = this.createInstance(descriptor, config);
            }
        }

        return result;
        */
    }

    /**
     * Returns an instance for the given contract. Use <tt>params</tt> attribute to overwrite the default
     * parameters for this contract. If <tt>params</tt> is defined, the singleton will be (re)created and its
     * parameters are updated.
     *
     * @method get
     * @param  {String} contract name
     * @param  {...*} [params] constructor parameters which, if defined, replaces its default arguments (see {{#crossLink "DI/register:method"}}{{/crossLink}} )
     * @return {Object} Class instance
     * @example
     App.di.register("ajax", ["rest"]) ;
     var ajax = App.di.get("ajax") ;
     ajax = App.di.get("ajax", "rest", true) ;
     **/
    get(fullName, config) {
        return DI.get.call(this, fullName, config);
    }

    static setProjection(list) {
        for (let key in list) {
            PROJECTIONS.set(key.toLowerCase(), list[key].toLowerCase());
        }

        return this;
    }

    setProjection(list) {
        for (let key in list) {
            this.projections.set(key.toLowerCase(), list[key].toLowerCase());
        }

        return this;
    }

    /**
     * Register a class by creating a contract. Use **getInstance** to obtain
     * an instance from this contract. The **params** parameter is a list of contracts or simple values.
     *
     * @method register
     * @chainable
     * @param {String} contract name of the contract
     * @param {Class} ref the class bind to this contract
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
    set(name, ref, config) {
        if (typeof name === 'string') {
            config.name = name;
        } else {
            config = name;
            ref = config.ref;
        }

        Injectable(config)(ref);

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
     * @private
     * @param contractStr
     * @param config
     * @returns {function()}
     */
    getFactory(contractName, config = {params: []}) {
        const contract = Object.assign({}, (this.find(contractName) || {}), config);

        return (...params) => {
            return this.get(contractName, params.length ? Object.assign(contract, {params}) : contract);
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
            instance, parentDescr,
            parentFullName = fullNameFor(contract),
            localMap = config.map || {};

        // Make sure the original contract is not altered
        parentDescr = Object.assign({map: {}, params: [], accept: [], reject: []}, contract, config);

        if (parentDescr.ref) {
            if ((!parentDescr.action || parentDescr.action === DI.ACTIONS.CREATE) && typeof parentDescr.ref === 'function') {
                instance = Array.isArray(parentDescr.params) ?
                    new parentDescr.ref(...(parentDescr.params || [])) : new parentDescr.ref(parentDescr.params);
            } else if (contract.action === DI.ACTIONS.INVOKE) {
                instance = Array.isArray(parentDescr.params) ?
                    parentDescr.ref(...(parentDescr.params || [])) : parentDescr.ref(parentDescr.params);
            } else {
                instance = parentDescr.ref;
            }

            deps[parentFullName] = {instance, contract: parentDescr};
        }

        // Fix inject list
        if (parentDescr.inject.length) {
            parentDescr.inject.forEach(dep => {
                const contract = this.find((localMap[dep.contractName] || dep.contractName)),
                    fullName = fullNameFor(contract);

                if (parentDescr.accept.length && !~parentDescr.accept.indexOf(contract.role)) {
                    throw Error(`Contract '${fullName}' with role '${contract.role}' is not whitelisted by '${parentFullName}'`);
                } else if (parentDescr.reject.length && ~parentDescr.reject.indexOf(contract.role)) {
                    throw Error(`Contract '${fullName}' with role '${contract.role}' is blacklisted by '${parentFullName}'`);
                }

                instance[dep.propertyName] = contract ?
                    (deps[fullName] || (deps[fullName] = this.get(contract, {deps}))) : dep.contractName;
            });
        }

        return instance;
    }
}


/* *** Private helpers ***/
// OBSOLETE??
/*
 function extractContracts(ref) {
 let args = ref.toString().match(/(?:(?:^function|constructor)[^\(]*\()([^\)]+)/);

 return args === null ? [] : args.slice(-1)[0].replace(/\s/g, '').split(',');
 }
 */
function splitContract(contractName) {
    const splitted = contractName.split(/\.|:/);
    const name = splitted.pop();

    return [(splitted.join('.') || ''), name];
}

function fullNameFor(descriptor) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? `${descriptor.ns}.` : '') + descriptor.name) : null;
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
function lookup(config, locator, relocator) {
    let name, ns, position;

    ({name, ns, position} = config);

    const isBubbling = config.lookup !== DI.DIRECTIONS.PARENT_TO_CHILD;

    if (ns === undefined) {
        [ns, name] = splitContract(name.toLowerCase());
        ns = ns.split('.');
        position = isBubbling ? ns.length : 0;
    }

    let fullName = `${(ns.slice(0, position).join('.'))}.${name}`
        .replace(/^\./, '');

    const projection = relocator(fullName);

    if (projection) {
        [ns, name] = splitContract(projection.toLowerCase());
        ns = ns.split('.');
        position = lookup ? ns.length : 0;

        fullName = `${(ns.slice(0, position).join('.'))}.${name}`
            .replace(/^\./, '');
    }

    const descriptor = locator(fullName);

    if (!descriptor && ns.length) {
        position = position + (isBubbling ? -1 : 1);

        if (position >= 0 && position <= ns.length) {
            return lookup({name, ns, position, lookup: config.lookup}, locator, relocator);
        }
    }

    return descriptor;
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
function createInstance(descriptor, config) {
    let instance, instances = (descriptor.instances || {}),
        localMap = descriptor.map || {};

    // Make sure the original contract is not altered
    const base = Object.assign({accept: [], reject: [], params: [], projections: {}}, descriptor, config),
        baseFullName = fullNameFor(base),
        projections = base.projections;

    instance = baseFullName; // ???

    if (base.ref) {
        if ((!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function') {
            instance = Array.isArray(base.params) ? new base.ref(...(base.params || [])) : new base.ref(base.params);
        } else if (base.action === DI.ACTIONS.INVOKE) {
            instance = Array.isArray(base.params) ? base.ref(...(base.params || [])) : base.ref(base.params);
        } else {
            instance = base.ref;
        }

        instances[baseFullName] = {instance, descriptor: base};

        if (base.singleton) {
            descriptor.instance = instance;
        }
    }

    // Fix inject list
    if (base.inject.length) {
        base.inject.forEach(dep => {
            const descriptor = this.lookupDescriptor(projections[dep.contractName] || dep.contractName),
                fullName = fullNameFor(descriptor);

            if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
                throw Error(`Contract '${fullName}' with role '${descriptor.role}' is not whitelisted by '${baseFullName}'`);
            } else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
                throw Error(`Contract '${fullName}' with role '${descriptor.role}' is blacklisted by '${baseFullName}'`);
            }

            instance[dep.propertyName] = descriptor ?
                (instances[fullName] || (instances[fullName] = this.get(descriptor, {instances}))) : dep.contractName;
        });
    }

    return instance;
}
