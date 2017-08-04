const DESCRIPTORS = new Map(),
    PROJECTIONS = new Map();

export function Injectable() {
    const settings = arguments[0] ? (typeof arguments[0] === 'string' ? {name: arguments[0]} : arguments[0]) : {};

    return function decorator(ref) {
        let descriptor = Object.assign(DESCRIPTORS.get(ref) || {inject: []}, settings);
        DESCRIPTORS.delete(ref); // Cleanup, because a class can be registered multiple times

        descriptor.ref = ref;

        if (!descriptor.name) { // class BarFoo {} --> { name: 'barFoo' }
            descriptor.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        } else { // 'namespace.bar' --> { ns: 'namespace', name: 'bar'}
            const [ns, name] = splitContract(descriptor.name);
            descriptor.name = name.toLowerCase();

            if (ns) {
                descriptor.ns = ns.toLowerCase();
            }
        }

        DESCRIPTORS.set(fullNameFor(descriptor).toLowerCase(), descriptor);
    }
}

export function Inject(name) {
    return function decorator(ref, argument, config) {
        let descriptor = DESCRIPTORS.get(ref.constructor) || {inject: []};

        descriptor.inject.push({property: argument, name, config});

        DESCRIPTORS.set(ref.constructor, descriptor);

        config.writable = true;
        return config;
    }
}

/** DI is a library for managing entities like functions and objects and their dependencies.
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
     * This Enum defines actions that can be applied to the descriptor reference
     *     when requested ({@link DI#get}).
     *
     * For example
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
     * The reference (ref) point to Foo which is a class and
     * @readonly
     * @enum {object}
     * @property {number} CREATE Create an instance using `new` (Default if ref is a function)
     * @property {number} INVOKE Call the function
     * @property {number} NONE Do nothing (Default is ref is an object)
    */
    static get ACTIONS() {
        return {
            CREATE: 0,
            INVOKE: 1,
            NONE: 2
        }
    }

    /**
     * Instances are useful if changes should not be persisted globally. Every change
     * made on an instance will only be accessible by that instance. An instance should only
     * be used in case where some projections are needed temporary.
     *
     * @class DI
     * @constructor
     * @param {object} [config] configuration object
     * @param {number} [config.lookup] lookup direction. See {@link DIRECTIONS} (default: DI.DIRECTIONS.PARENT_TO_CHILD)
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
        return descriptor.get((ns ? `${ns}.` : '') + name);
    }

    lookupDescriptor(fullName, config) {
        return DI.lookupDescriptor.call(this, fullName, config);
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
        DI.removeDescriptor(name, ns);

        return this;
    }

    static removeDescriptor(name, ns) {
        DESCRIPTORS.delete(fullNameFor({name, ns}));

        return this;
    }

    /**
     *
     * @param fullName
     * @param config
     * @returns {*}
     */
    get(fullName, config) {
        return DI.get.call(this, fullName, config);
    }

    static get(fullName, config) {
        const descriptor = typeof fullName === 'string' ? this.lookupDescriptor(fullName, config) : fullName;
        let instance = null;

        if (descriptor) {
            if (descriptor.singleton && descriptor.instance) {
                instance = descriptor.instance;
            } else {
                instance = createInstance.call(this, descriptor, config);
            }
        }

        return instance;
    }

    set(config) {
        DI.set(config);

        return this;
    }

    static set(config) {
        Injectable(config)(config.ref);

        return this;
    }

    getFactory(fullName, config = {params: []}) {
        const descriptor = Object.assign({}, (this.lookupDescriptor(fullName, config) || {}), config);

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

    //instance = baseFullName; // ???

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

    if (base.inject.length) {
        base.inject.forEach(dep => {
            const descriptor = this.lookupDescriptor(projections[dep.name] || dep.name),
                fullName = fullNameFor(descriptor);

            if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
                throw Error(`'${fullName}' has role '${descriptor.role}', which is not whitelisted by '${baseFullName}'`);
            } else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
                throw Error(`'${fullName}' has role '${descriptor.role}', which is blacklisted by '${baseFullName}'`);
            }

            const injectable = descriptor ? (instances[fullName] || (instances[fullName] = this.get(descriptor, {instances}))) : dep.name;

            if (typeof instance[dep.property] === 'function') {
                instance[dep.property](injectable);
            } else {
                instance[dep.property] = injectable;
            }
        });
    }

    return instance;
}
