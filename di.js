const DESCRIPTORS = new Map(),
    PROJECTIONS = new Map();

/**
 * This is a decorator function which registers the entity it is attached to
 *
 * @example
 *
 *     \@Injectable({name: 'Foo'})
 *     class Foo { ... }
 *
 */
export function Injectable() {
    const settings = arguments[0] ? (typeof arguments[0] === 'string' ? {name: arguments[0]} : arguments[0]) : {};

    return function decorator(ref) {
        let descriptor = Object.assign(DESCRIPTORS.get(ref) || {}, settings);
        DESCRIPTORS.delete(ref); // Cleanup, because a class can be registered multiple times

        descriptor.ref = ref;

        // By default an object ref is a singleton
        if (typeof ref === 'object' && descriptor.singleton === undefined) {
            descriptor.singleton = true;
        }

        if (!descriptor.name) { // class BarFoo {} --> { name: 'barFoo' }
            descriptor.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        } else { // 'namespace.bar' --> { ns: 'namespace', name: 'bar'}
            const [ns, name] = splitContract(descriptor.name);
            descriptor.name = name.toLowerCase();

            if (ns) {
                descriptor.ns = ns.toLowerCase();
            }
        }

        ((this || {}).descriptors || DESCRIPTORS).set(fullNameFor(descriptor).toLowerCase(), descriptor);
    }
}

/**
 * This is a decorator function which injects dependencies into the property or function
 * it is attached to
 *
 * @example
 *
 *     \@Injectable({name: 'foo'})
 *     class Foo {
 *         \@Inject({name: 'bar'})
 *         counter
 *
 *         @Inject({name: 'baz'})
 *         addService(service) {
 *            this.service = service;
 *         }
 *     }
 *
 */
export function Inject(config) {
    return function decorator(ref, property, settings) {
        let descriptor = DESCRIPTORS.get(ref.constructor) || {inject: []};

        if (typeof config === 'string') {
            config = {name: config};
        }

        config.property = property;

        descriptor.inject.push(config);

        DESCRIPTORS.set(ref.constructor, descriptor);

        settings.writable = true;
        return settings;
    }
}

/** __DI-XXL__ is a very generic Dependency Injection (DI) library, facilitating lazy initialization
 * and loose coupling. It is generic, it can inject anything into anything in multiple ways. Together
 * with support for namespaces, decorators and factory functions it is a powerful tool ready for complex
 * projects.
 */
export class DI {
    /**
     * This Enum defines the direction in which namespaces will be traversed
     *
     * @example
     *
     *    DI.set({
     *        name: 'Foo',
     *        lookup: DI.DIRECTIONS.CHILD_TO_PARENT
     *        ...
     *    });
     * }
     *
     * @readonly
     * @enum {object}
     * @property {number} PARENT_TO_CHILD Upwards (Capturing)
     * @property {number} CHILD_TO_PARENT Downwards (Bubbling)
     */
    static DIRECTIONS = {
        PARENT_TO_CHILD: 1,
        CHILD_TO_PARENT: 2
    };

    /**
     * Enum with all available actions applicable to the descriptor reference when requested ({@link DI#get}).
     *
     * @example
     * class Foo {}
     *
     * DI.set({
     *     name: 'foo',
     *     ref: Foo,
     *     action: DI.ACTIONS.CREATE
     * });
     *
     * function Store() { ... }
     *
     * DI.set({
     *     name: 'app',
     *     ref: Store,
     *     action: DI.ACTIONS.INVOKE
     * });
     *
     * const App = {};
     *
     * DI.set({
     *     name: 'App',
     *     ref: App,
     *     action: DI.ACTIONS.NONE
     * });
     *
     * @type Enum
     * @readonly
     * @enum {object}
     * @property {number} CREATE Create an instance using `new` (Default if __ref__ is a function)
     * @property {number} INVOKE Call the function
     * @property {number} NONE Do nothing (Default is __ref__ is an object)
     */
    static get ACTIONS() {
        return {
            CREATE: 0,
            INVOKE: 1,
            NONE: 2
        }
    }

    /**
     * Instances are useful if changes should be kept within the scope of the instance only. So, every
     * change made on an instance will only be accessible by that instance. Its best use case is
     * when temporary projection are needed. In any other case simply use `DI` directly.
     *
     * @class DI
     * @constructor
     * @param {object} [config] configuration object
     * @param {number} [config.lookup] lookup direction. See {@link DI#DIRECTIONS} (default: PARENT_TO_CHILD)
     **/
    constructor(config = {}) {
        this.lookup = (config.lookup || DI.DIRECTIONS.PARENT_TO_CHILD);
        this.config = config;

        this.projections = new Map();
        this.descriptors = new Map();
    }

    getDescriptor(name, ns) {
        return DI.getDescriptor(name, ns, this.descriptors) || DI.getDescriptor(name, ns);
    }

    static getDescriptor(name, ns, descriptor = DESCRIPTORS) {
        return descriptor.get(fullNameFor({name, ns}));
    }

    lookupDescriptor(fullName, config) {
        return DI.lookupDescriptor.call(this, fullName, config);
    }

    static lookupDescriptor(fullName, config = {}) {
        const settings = Object.assign({lookup: this.lookup || DI.DIRECTIONS.PARENT_TO_CHILD}, this.config, config, {name: fullName});

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
        return DI.getProjection(name, ns, this.projections) || DI.getProjection(name, ns);
    }

    static getProjection(name, ns, projections = PROJECTIONS) {
        return projections.get(fullNameFor({name, ns}));
    }

    setProjection(list) {
        DI.setProjection(list, this.projections);

        return this;
    }

    static setProjection(list, projections = PROJECTIONS) {
        for (let key in list) {
            projections.set(key.toLowerCase(), list[key]);
        }

        return this;
    }

    removeProjection(key) {
        DI.removeProjection(key, this.projections);

        return this;
    }

    static removeProjection(key, projections = PROJECTIONS) {
        projections.delete(key.toLowerCase());

        return this;
    }

    removeDescriptor(name, ns) {
        DI.removeDescriptor(name, ns, this.descriptors);

        return this;
    }

    /**
     *
     * @param name
     * @param ns
     * @param descriptors
     * @returns {DI}
     */
    static removeDescriptor(name, ns, descriptors = DESCRIPTORS) {
        descriptors.delete(fullNameFor({name, ns}));

        return this;
    }

    /**
     * See{@link DI.get}
     */
    get(name, config) {
        return DI.get.call(this, name, config);
    }

    /**
     * Returns the outcome of the reference processed by one of the {@link DI#ACTIONS}. Use __config__ to
     * overwrite one or more descriptor values. Below is an example in which __params__ is replaced.
     *
     * @example
     * class Foo {
     *     constructor(base) { this.base = base; }
     *     addToBase(num) { return this.base + num; }
     * }
     *
     * const descriptor = {
     *     name: 'foo',
     *     ref: Foo,
     *     action: DI.ACTIONS.CREATE,
     *     params: [100]
     * };
     * di.set(descriptor);
     *
     * di.get('foo').addToBase(1); // --> 101
     * di.get('foo', {params: [1]}).addToBase(1); // --> 2
     *
     * @param {string} name name of the descriptor
     * @param {object} [config] configuration
     * @param {number} [config.lookup] Direction of namespace traversal
     * @param {array} [config.params] List of arguments (e.g: used to create an instance)
     * @returns {*}
     */
    static get(name, config) {
        let descriptor = typeof name === 'string' ? this.lookupDescriptor(name, config) : name;
        let instance = null;

        if (descriptor) {
            if (descriptor.inherit) {
                descriptor = inheritance.call(this, descriptor, config);
            }

            if (descriptor.singleton && descriptor.instance) {
                instance = descriptor.instance;
            } else {
                instance = createInstance.call(this, descriptor, config);
            }
        }

        return instance;
    }

    /**
     * See {@link DI.set}
     */
    set(descriptor) {
        return DI.set.call(this, config);
    }

    /**
     * Register an entity using
     * @param config
     * @returns {*}
     */
    static set(descriptor) {
        Injectable(config).call(this, config.ref);

        return this;
    }

    getFactory(fullName, config) {
        return DI.getFactory(fullName, config);
    }


    static getFactory(fullName, config = {params: []}) {

        const descriptor = Object.assign({}, (typeof fullName === 'string' ? this.lookupDescriptor(fullName, config) || {} : fullName), config);

        return (...params) => {
            return this.get(params.length ? Object.assign(descriptor, {params}) : descriptor);
        };
    }
}

/* *** Private helpers ***/
function splitContract(fullName) {
    const parts = fullName.split(/\.|:/);
    const name = parts.pop();

    return [(parts.join('.') || ''), name];
}

function fullNameFor(descriptor) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? `${descriptor.ns}.` : '') + descriptor.name).toLowerCase() : null;
}

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

function createInstance(descriptor, config) {
    let instance, instances = (descriptor.instances || {});

    // Make sure the original descriptor is not altered
    const base = Object.assign({accept: [], reject: [], params: [], projections: {}}, descriptor, config),
        baseFullName = fullNameFor(base),
        projections = base.projections;

    if (base.ref) {
        if ((!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function') {
            instance = Array.isArray(base.params) ? new base.ref(...(base.params || [])) : new base.ref(base.params);
        } else if (base.action === DI.ACTIONS.INVOKE) {
            instance = Array.isArray(base.params) ? base.ref(...(base.params || [])) : base.ref(base.params);
        } else {
            instance = base.params ? Object.assign(base.ref, base.params) : base.ref;
        }

        if (base.singleton) {
            descriptor.instance = instance;
        } else if (typeof base.ref === 'object') {
            instance = Object.create(base.ref);
        }

        instances[baseFullName] = {instance, descriptor: base};
    }

    if ((base.inject || []).length) {
        base.inject.forEach(dep => {
            const descriptor = this.lookupDescriptor(projections[dep.name] || dep.name),
                fullName = fullNameFor(descriptor);

            if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
                throw Error(`'${fullName}' has role '${descriptor.role}', which is not whitelisted by '${baseFullName}'`);
            } else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
                throw Error(`'${fullName}' has role '${descriptor.role}', which is blacklisted by '${baseFullName}'`);
            }

            let injectable;
            if (dep.factory) {
                injectable = DI.getFactory(descriptor);
            } else {
                injectable = descriptor ? (instances[fullName] || (instances[fullName] = this.get(descriptor, {instances}))) : dep.name;
            }

            if (typeof instance[dep.property] === 'function') {
                instance[dep.property](injectable);
            } else {
                instance[dep.property] = injectable;
            }
        });
    }

    return instance;
}

function inheritance(descriptor, config) {
    if (descriptor.inherit) {
        const parent = this.lookupDescriptor(descriptor.inherit, config);
        descriptor = Object.assign({}, parent, descriptor);

        if (parent.inherit) {
            descriptor = inheritance.call(this. descriptor, config);
        }
    }

    return descriptor;
}