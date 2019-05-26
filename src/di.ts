const DESCRIPTORS = new Map();
const PROJECTIONS = new Map();

export interface DIInject {
    property: string;
    name: string;
}

export interface DIDescriptor {
    name: string;
    ref: any,
    ns?: string;
    inherit?: string;
    params?: any[];
    inject?: DIInject[];
    action?: any;
    singleton?: boolean;
}


/**
 * A decorator which registers the class it is attached to. The argument is described for {@link DI.constructor}
 *
 * @example
 *
 * \@Injectable({name: 'foo'})
 * class Foo { ... }
 */
export function Injectable(descriptor: DIDescriptor) {
    const settings = descriptor ? (typeof descriptor === 'string' ? {name: descriptor} : descriptor) : {};

    return function decorator(ref: any) {
        const descriptor = Object.assign(DESCRIPTORS.get(ref) || {}, settings);
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
    };
}

/**
 * Decorator function which registers the entity names to be injected
 *
 * @example
 *
 * \@Injectable({name: 'foo'})
 * class Foo {
 *     \@Inject({name: 'bar'})
 *     counter
 *
 *     @Inject({name: 'baz'})
 *     addService(service) {
 *        this.service = service;
 *     }
 * }
 */
export function Inject(config: Partial<DIInject>) {
    return function decorator(ref, property, settings) {
        const descriptor = DESCRIPTORS.get(ref.constructor) || {inject: []};

        if (typeof config === 'string') {
            config = {name: config};
        }

        config.property = property;

        descriptor.inject.push(config);

        DESCRIPTORS.set(ref.constructor, descriptor);

        settings.writable = true;
        return settings;
    };
}

/** __DI-XXL__ is a very generic Dependency Injection (DI) library, facilitating lazy initialization
 * and loose coupling. It is generic, it can inject everything into anything in multiple ways. Together
 * with support for namespaces, decorators and factory functions it is a powerful tool ready for complex
 * projects.
 */
export class DI {
    /**
     * Lookup direction for namespace traversal.
     *
     * @example
     *
     *    DI.set({
     *        name: 'a.b.c.d.Foo',
     *        lookup: DI.DIRECTIONS.CHILD_TO_PARENT
     *        ...
     *    });
     * }
     *
     * @readonly
     * @enum {number}
     * @property {number} PARENT_TO_CHILD Upwards (Capturing)
     * @property {number} CHILD_TO_PARENT Downwards (Bubbling)
     */
    static get DIRECTIONS() {
        return {
            CHILD_TO_PARENT: 2,
            PARENT_TO_CHILD: 1
        };
    }

    public static defaults: any;

    /**
     * List of actions applicable on the entities when requested ({@link DI.get}).
     * For example, if the entity is a class, you probably want to return an instance of that class, so use __DI.ACTIONS.CREATE__.
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
     * @enum {number}
     * @readonly
     * @enum {object}
     * @property {number} CREATE Create an instance using `new` (Default if the entity is a function/class)
     * @property {number} INVOKE Execute the function
     * @property {number} NONE Do nothing (Default if the entity is an object)
     */
    static get ACTIONS() {
        return {
            CREATE: 0,
            INVOKE: 1,
            NONE: 2
        };
    }


    /**
     * Returns the descriptor identified by the given __name__. However, it will not
     * traverse the namespace
     *
     * @param {string} name Entity name
     * @returns {object} descriptor
     */
    public static getDescriptor(name: string, ns?: string, descriptor = DESCRIPTORS) {
        return descriptor.get(fullNameFor({name, ns}));
    }


    /**
     * This function is identical to {@link DI.getDescriptor} except it will traverse the namespace until it finds it or
     * reaches the end of the namespace.
     *
     * @example
     *
     *     const descriptor = {
        *         name: 'a.b.foo',
        *         ...
        *     }
        *
        *     DI.lookupDescriptor('a.b.c.d.e.foo', {lookup: DI.DIRECTIONS.PARENT_TO_CHILD}); // will find `a.b.foo`
        *
        * @param name
        * @param {object} [config] Configuration of the lookup process
        * @param {object} [config.lookup] Lookup direction (See {@Link DI.DIRECTIONS})
        * @returns {object} Descriptor
        */
       public static lookupDescriptor(name: string, config = {}) {
           const settings = Object.assign({}, this.defaults, config, {name});
   
           const descriptor = lookup(settings,
               name => {
                   return this.getDescriptor(name);
               },
               name => {
                   return this.getProjection(name);
               }
           );
   
           return descriptor;
       }


    /**
     * Returns a factory for the given entity name
     *
     * @example
     * class Foo {
        *     constructor(val) { this.val = val; }
        * }
        *
        * DI.set({name: 'foo', ref: Foo, params: [1]});
        * const factory = DI.getFactory();
        * let foo = factory(); // foo.val === 1
        * foo = factory(2); // foo.val === 2
        *
        * DI.getFactory(10)().val === 10
        * DI.getFactory(10)(20).val === 20
        *
        * @param {string} name Entity name
        * @param {object} config Descriptor defaults (Checkout {@link DI#constructor} for all descriptor properties)
        * @returns {function(...[*])}
        */
       public static getFactory(name, config = {params: []}) {
           const descriptor = Object.assign({}, (typeof name === 'string' ? this.lookupDescriptor(name, config) || {} : name), config);
   
           return (...params) => {
               return this.get(name, params.length ? Object.assign(descriptor, {params}) : descriptor);
           };
       }

           /**
     * Returns the projection identified by the given __name__. However, it will not
     * traverse the namespace
     *
     * @param {string} name entity name (it can include the namespace)
     * @param {string} [ns] namespace
     * @returns {object} descriptor
     */
    public static getProjection(name: string, ns?: string, projections = PROJECTIONS) {
        return projections.get(fullNameFor({name, ns}));
    }

        /**
     * Returns the processed entity using of {@link DI.ACTIONS}. Use __config__ to
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
        * @param {number} [config.lookup] Direction of namespace traversal (See {@link DI.DIRECTIONS})
        * @param {array} [config.params] List of arguments (e.g: used to create an instance)
        * @returns {*} The processed entity (See {@link DI.ACTIONS})
        */
       public static get(name: string, config?: any) {
           let descriptor = typeof name === 'string' ? (this.getDescriptor((this.getProjection(name) || name)) || this.lookupDescriptor(name, config)) : name;
           let instance = null;
   
           if (descriptor) {
               if (descriptor.inherit) {
                   descriptor = inheritance.call(this, descriptor, config);
               }
   
               if (descriptor.singleton && descriptor.instance) {
                   instance = descriptor.instance;
               } else if (descriptor.name) {
                   instance = createInstance.call(this, descriptor, config);
               }
           }
   
           return instance;
       }


    /**
     * Define one or projection
     *
     * @example
     *
     * DI.setProjection( { foo: 'bar', baz: 'a.b.mooz'} ); // 'foo' being projected to 'bar'
     * DI.get('foo') instanceof Bar
     *
     * @param {Object} list Projections with the key being the entity name to be replaced by its value
     * @returns {DI}
     */
    public static setProjection(list, projections = PROJECTIONS) {
        for (const key in list) {
            if (list.hasOwnProperty(key)) {
                projections.set(key.toLowerCase(), list[key]);
            }
        }

        return this;
    }


    /**
     * Remove one projection
     *
     * @example
     *
     * DI.setProjection({foo: 'bar'}); // --> foo is projected to bar
     * DI.removeProjection('foo');     // --> remove the above projection
     *
     * @param key
     * @param projections
     * @returns {DI}
     */
    public static removeProjection(key: string, projections = PROJECTIONS) {
        projections.delete(key.toLowerCase());

        return this;
    }

    /**
     * Remove a descriptor/entity
     *
     * @example
     *
     * DI.set({name: 'foo', ref: Foo});
     * DI.removeDescriptor('foo');
     * DI.get('foo')
     *
     * @param {string} name entity name
     * @returns {function} DI class
     */
    public static removeDescriptor(name: string, ns?: string, descriptors = DESCRIPTORS) {
        descriptors.delete(fullNameFor({name, ns}));

        return this;
    }


    /**
     * Register an entity
     * @param {descriptor} descriptor defaults (Checkout {@link DI.constructor} for all descriptor properties)
     * @returns {function} DI class
     */
    public static set(descriptor: DIDescriptor) {
        Injectable(descriptor).call(this, descriptor.ref);

        return this;
    }

    private defaults: any;    // ?????
    private projections: any; // Record???
    private descriptors: Map<string, DIDescriptor>;

    /**
     * Use an instance if changes should be kept encapsulated and only accessible by that instance.
     * Its best use case is when temporary projection (See {@link DI.setProjection}) are needed. In any other case simply use `DI` directly.
     * The values of the __descriptor__ are used as defaults anywhere in the library where descriptors are
     * required (e.g. {@link DI.get})
     *
     * @constructor
     * @param {object} [descriptor] Descriptor used as the base for all other descriptors
     * @param {array} [descriptor.accept] List of roles which are allowed to be injected
     * @param {number} [descriptor.action] The action to be applied to the entity when requested (see {@link DI.ACTIONS})
     * @param {string} [descriptor.inherit] Descriptor properties of the referenced entity are used as defaults too
     * @param {array} [descriptor.inject] List of entity names to be injected
     * @param {string} [descriptor.name] Entity name, used to access or inject the entity
     * @param {array|object} [descriptor.params] List of parameters used to initialise/call the entity
     * @param {string} [descriptor.reject] List of roles which are not allowed to be injected
     * @param {string} [descriptor.ref] The entity (e.g.: class or function, sting)
     * @param {string} [descriptor.role] Role of the entity (e.g: Service or Component)
     * @param {boolean} [descriptor.singleton] Turns the entity into a singleton (Default for object entities)
     * @param {number} [descriptor.lookup] Lookup direction. See {@link DI.DIRECTIONS} (default: __PARENT_TO_CHILD__)
     **/
    constructor(descriptor = {}) {
        this.defaults = Object.assign({lookup: DI.DIRECTIONS.PARENT_TO_CHILD}, descriptor);

        this.projections = new Map();
        this.descriptors = new Map();
    }

    /**
     * See {@link DI.getDescriptor}
     */
    public getDescriptor(name: string, ns?: string) {
        let descriptor = DI.getDescriptor(name, ns, this.descriptors);

        if (descriptor === undefined) {
            descriptor = DI.getDescriptor(name, ns);
        }

        return descriptor;
    }

    /**
     * See {@link DI.lookupDescriptor}
     */
    public lookupDescriptor(name: string, config?:any) {
        return DI.lookupDescriptor.call(this, name, config);
    }

    /**
     * See {@link DI.getProjection}
     */
    public getProjection(name: string, ns?: string) {
        let projection = DI.getProjection(name, ns, this.projections);

        if (projection === undefined) {
            projection = DI.getProjection(name, ns);
        }

        return projection;
    }

    /**
     * See {@link DI.seProjection}
     * @returns {object} DI instance
     */
    public setProjection(list: any) {
        DI.setProjection(list, this.projections);

        return this;
    }

    /**
     * See {@link DI.removeProjection}
     *
     * @returns {object} DI instance
     */
    public removeProjection(key: string) {
        this.projections.set(key.toLowerCase(), null); // Map to null

        return this;
    }

    /**
     * See {@link DI.removeDescriptor}
     *
     * @returns {object} DI instance
     */
    public removeDescriptor(name: string) {
        this.descriptors.set(fullNameFor({name}), null);

        return this;
    }

    /**
     * See{@link DI.get}
     */
    public get(name: string, config?: any) {
        return DI.get.call(this, name, config);
    }

    /**
     * See {@link DI.set}
     * @returns {object} DI instance
     */
    public set(descriptor: DIDescriptor) {
        return DI.set.call(this, descriptor);
    }

    /**
     * See {@link DI.getFactory}
     */
    public getFactory(name: string, config: any) {
        return DI.getFactory(name, config);
    }
}

/**
 * Separate the namespace from the entity name
 *
 * @private
 * @param {string} name Entity name plus the namespace (if any)
 * @returns {Array} [namespace: string, name: string]
 */
function splitContract(fullName: string) {
    const parts = fullName.split(/\.|:/);
    const name = parts.pop();

    return [(parts.join('.') || ''), name];
}

/**
 * Concat the namespace and the entity name
 *
 * @private
 * @param descriptor
 * @returns {string} entity name
 */
function fullNameFor(descriptor: Partial<DIDescriptor>) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? `${descriptor.ns}.` : '') + descriptor.name).toLowerCase() : null;
}

/**
 * This function holds the implementation of the namespace traversal. It looks up the descriptor
 *
 * @private
 * @param {object} config descriptor defaults
 * @param {function} locator function which returns a descriptor
 * @param {function} relocator function which returns a projection (if any)
 * @returns {object} descriptor
 */
function lookup(config: any, locator: any, relocator: any) {
    let name, ns, position;

    ({name, ns, position} = config);

    const isBubbling = config.lookup === DI.DIRECTIONS.CHILD_TO_PARENT;

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
        position = isBubbling ? ns.length : 0;

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
 * Determines if an instance can be created from the entity
 *
 * @private
 * @param {object} base descriptor
 * @returns {boolean}
 */
function canActionDoCreate(base: any) {
    return (!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function';
}

/**
 * Returns the processed entity based on the defined DI.ACTIONS
 *
 * @private
 * @param {object} base descriptor
 * @returns {{instance: *, descriptor: *}}
 */
function createBaseInstance(base: any) {
    let instance;

    if (canActionDoCreate(base)) {
        instance = base.params ? (Array.isArray(base.params) ? new base.ref(...(base.params)) : new base.ref(base.params)) : new base.ref();
    } else if (base.action === DI.ACTIONS.INVOKE) {
        instance = base.params ? (Array.isArray(base.params) ? base.ref(...(base.params)) : base.ref(base.params)) : base.ref();
    } else {
        instance = base.params ? Object.assign(base.ref, base.params) : base.ref;
    }

    return {instance, descriptor: base};
}

/**
 * This function injects all dependencies defined by the `inject` array into the base entity
 *
 * @private
 * @param {string} baseFullName entity name of the requested entity
 * @param {object base the requested entity's descriptor
 * @param {object} projections projections list
 * @param {Array} instances List of all involved processed entities
 * @param {object} requested instance
 */
function injectIntoBase(baseFullName: any, base: any, projections: any, instances: any, instance: any) {
    base.inject.forEach(dep => {
        const descriptor = this.lookupDescriptor(projections[dep.name] || dep.name, {lookup: base.lookup});
        const fullName = fullNameFor(descriptor);

        if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
            throw Error(`'${fullName}' has role '${descriptor.role}', which is not whitelisted by '${baseFullName}'`);
        } else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
            throw Error(`'${fullName}' has role '${descriptor.role}', which is blacklisted by '${baseFullName}'`);
        }

        const injectable = dep.factory ? DI.getFactory(descriptor) :
            descriptor ? (instances[fullName] || (instances[fullName] = this.get(descriptor, {instances}))) : dep.name;

        if (typeof instance[dep.property] === 'function') {
            instance[dep.property](injectable);
        } else {
            instance[dep.property] = injectable;
        }
    });
}

/**
 * This function returns the processed entity with all its dependencies injected
 *
 * @private
 * @param {object} descriptor default descriptor values
 * @param {object} config descriptor values
 * @returns {*} processed entity
 */
function createInstance(descriptor: any, config: any) {
    let instance; 
    const instances = (descriptor.instances || {});


    // Make sure the original descriptor is not altered
    const base = Object.assign({accept: [], reject: [], projections: {}}, descriptor, config);
    const baseFullName = fullNameFor(base);
    const projections = base.projections;

    instances[baseFullName] = createBaseInstance(base);
    instance = instances[baseFullName].instance;

    if (base.singleton) {
        descriptor.instance = instance;
    } else if (typeof base.ref === 'object') {
        instance = Object.create(base.ref);
    }

    if ((base.inject || []).length) {
        injectIntoBase.call(this, baseFullName, base, projections, instances, instance);
    }

    return instance;
}

/**
 * Implementation of descriptor inheritance. It is recursive, as parents can inherit too, etc
 *
 * @private
 * @param {object} descriptor default descriptor values
 * @param {object} config descriptor values
 * @returns {object} merged descriptor
 */
function inheritance(descriptor: any, config: any) {
    if (descriptor.inherit) {
        const parent = this.lookupDescriptor(descriptor.inherit, config);
        descriptor = Object.assign({}, parent, descriptor);
        descriptor.inherit = parent.inherit;

        descriptor = inheritance.call(this, descriptor, config);
    }

    return descriptor;
}