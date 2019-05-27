"use strict";
exports.__esModule = true;
var DESCRIPTORS = new Map();
var PROJECTIONS = new Map();
/**
 * A decorator which registers the class it is attached to. The argument is described for {@link DI.constructor}
 *
 * @example
 *
 * \@Injectable({name: 'foo'})
 * class Foo { ... }
 */
function Injectable(descriptor) {
    var settings = descriptor ? (typeof descriptor === 'string' ? { name: descriptor } : descriptor) : {};
    return function decorator(ref) {
        var descriptor = Object.assign(DESCRIPTORS.get(ref) || {}, settings);
        DESCRIPTORS["delete"](ref); // Cleanup, because a class can be registered multiple times
        descriptor.ref = ref;
        // By default an object ref is a singleton
        if (typeof ref === 'object' && descriptor.singleton === undefined) {
            descriptor.singleton = true;
        }
        if (!descriptor.name) { // class BarFoo {} --> { name: 'barFoo' }
            descriptor.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        }
        else { // 'namespace.bar' --> { ns: 'namespace', name: 'bar'}
            var _a = splitContract(descriptor.name), ns = _a[0], name_1 = _a[1];
            descriptor.name = name_1.toLowerCase();
            if (ns) {
                descriptor.ns = ns.toLowerCase();
            }
        }
        ((this || {}).descriptors || DESCRIPTORS).set(fullNameFor(descriptor).toLowerCase(), descriptor);
    };
}
exports.Injectable = Injectable;
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
function Inject(config) {
    return function decorator(ref, property, settings) {
        var descriptor = DESCRIPTORS.get(ref.constructor) || { inject: [] };
        if (typeof config === 'string') {
            config = { name: config };
        }
        config.property = property;
        descriptor.inject.push(config);
        DESCRIPTORS.set(ref.constructor, descriptor);
        settings.writable = true;
        return settings;
    };
}
exports.Inject = Inject;
/** __DI-XXL__ is a very generic Dependency Injection (DI) library, facilitating lazy initialization
 * and loose coupling. It is generic, it can inject everything into anything in multiple ways. Together
 * with support for namespaces, decorators and factory functions it is a powerful tool ready for complex
 * projects.
 */
var DI = /** @class */ (function () {
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
    function DI(descriptor) {
        if (descriptor === void 0) { descriptor = {}; }
        this.defaults = Object.assign({ lookup: DI.DIRECTIONS.PARENT_TO_CHILD }, descriptor);
        this.projections = new Map();
        this.descriptors = new Map();
    }
    Object.defineProperty(DI, "DIRECTIONS", {
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
        get: function () {
            return {
                CHILD_TO_PARENT: 2,
                PARENT_TO_CHILD: 1
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DI, "ACTIONS", {
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
        get: function () {
            return {
                CREATE: 0,
                INVOKE: 1,
                NONE: 2
            };
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the descriptor identified by the given __name__. However, it will not
     * traverse the namespace
     *
     * @param {string} name Entity name
     * @returns {object} descriptor
     */
    DI.getDescriptor = function (name, ns, descriptor) {
        if (descriptor === void 0) { descriptor = DESCRIPTORS; }
        return descriptor.get(fullNameFor({ name: name, ns: ns }));
    };
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
    DI.lookupDescriptor = function (name, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        var settings = Object.assign({}, this.defaults, config, { name: name });
        var descriptor = lookup(settings, function (name) {
            return _this.getDescriptor(name);
        }, function (name) {
            return _this.getProjection(name);
        });
        return descriptor;
    };
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
    DI.getFactory = function (name, config) {
        var _this = this;
        if (config === void 0) { config = { params: [] }; }
        var descriptor = Object.assign({}, (typeof name === 'string' ? this.lookupDescriptor(name, config) || {} : name), config);
        return function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            return _this.get(name, params.length ? Object.assign(descriptor, { params: params }) : descriptor);
        };
    };
    /**
* Returns the projection identified by the given __name__. However, it will not
* traverse the namespace
*
* @param {string} name entity name (it can include the namespace)
* @param {string} [ns] namespace
* @returns {object} descriptor
*/
    DI.getProjection = function (name, ns, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        return projections.get(fullNameFor({ name: name, ns: ns }));
    };
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
    DI.get = function (name, config) {
        var descriptor = typeof name === 'string' ? (this.getDescriptor((this.getProjection(name) || name)) || this.lookupDescriptor(name, config)) : name;
        var instance = null;
        if (descriptor) {
            if (descriptor.inherit) {
                descriptor = inheritance.call(this, descriptor, config);
            }
            if (descriptor.singleton && descriptor.instance) {
                instance = descriptor.instance;
            }
            else if (descriptor.name) {
                instance = createInstance.call(this, descriptor, config);
            }
        }
        return instance;
    };
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
    DI.setProjection = function (list, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        for (var key in list) {
            if (list.hasOwnProperty(key)) {
                projections.set(key.toLowerCase(), list[key]);
            }
        }
        return this;
    };
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
    DI.removeProjection = function (key, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        projections["delete"](key.toLowerCase());
        return this;
    };
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
    DI.removeDescriptor = function (name, ns, descriptors) {
        if (descriptors === void 0) { descriptors = DESCRIPTORS; }
        descriptors["delete"](fullNameFor({ name: name, ns: ns }));
        return this;
    };
    /**
     * Register an entity
     * @param {descriptor} descriptor defaults (Checkout {@link DI.constructor} for all descriptor properties)
     * @returns {function} DI class
     */
    DI.set = function (descriptor) {
        Injectable(descriptor).call(this, descriptor.ref);
        return this;
    };
    /**
     * See {@link DI.getDescriptor}
     */
    DI.prototype.getDescriptor = function (name, ns) {
        var descriptor = DI.getDescriptor(name, ns, this.descriptors);
        if (descriptor === undefined) {
            descriptor = DI.getDescriptor(name, ns);
        }
        return descriptor;
    };
    /**
     * See {@link DI.lookupDescriptor}
     */
    DI.prototype.lookupDescriptor = function (name, config) {
        return DI.lookupDescriptor.call(this, name, config);
    };
    /**
     * See {@link DI.getProjection}
     */
    DI.prototype.getProjection = function (name, ns) {
        var projection = DI.getProjection(name, ns, this.projections);
        if (projection === undefined) {
            projection = DI.getProjection(name, ns);
        }
        return projection;
    };
    /**
     * See {@link DI.seProjection}
     * @returns {object} DI instance
     */
    DI.prototype.setProjection = function (list) {
        DI.setProjection(list, this.projections);
        return this;
    };
    /**
     * See {@link DI.removeProjection}
     *
     * @returns {object} DI instance
     */
    DI.prototype.removeProjection = function (key) {
        this.projections.set(key.toLowerCase(), null); // Map to null
        return this;
    };
    /**
     * See {@link DI.removeDescriptor}
     *
     * @returns {object} DI instance
     */
    DI.prototype.removeDescriptor = function (name) {
        this.descriptors.set(fullNameFor({ name: name }), null);
        return this;
    };
    /**
     * See{@link DI.get}
     */
    DI.prototype.get = function (name, config) {
        return DI.get.call(this, name, config);
    };
    /**
     * See {@link DI.set}
     * @returns {object} DI instance
     */
    DI.prototype.set = function (descriptor) {
        return DI.set.call(this, descriptor);
    };
    /**
     * See {@link DI.getFactory}
     */
    DI.prototype.getFactory = function (name, config) {
        return DI.getFactory(name, config);
    };
    return DI;
}());
exports.DI = DI;
/**
 * Separate the namespace from the entity name
 *
 * @private
 * @param {string} name Entity name plus the namespace (if any)
 * @returns {Array} [namespace: string, name: string]
 */
function splitContract(fullName) {
    var parts = fullName.split(/\.|:/);
    var name = parts.pop();
    return [(parts.join('.') || ''), name];
}
/**
 * Concat the namespace and the entity name
 *
 * @private
 * @param descriptor
 * @returns {string} entity name
 */
function fullNameFor(descriptor) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? descriptor.ns + "." : '') + descriptor.name).toLowerCase() : null;
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
function lookup(config, locator, relocator) {
    var _a, _b;
    var name, ns, position;
    (name = config.name, ns = config.ns, position = config.position);
    var isBubbling = config.lookup === DI.DIRECTIONS.CHILD_TO_PARENT;
    if (ns === undefined) {
        _a = splitContract(name.toLowerCase()), ns = _a[0], name = _a[1];
        ns = ns.split('.');
        position = isBubbling ? ns.length : 0;
    }
    var fullName = ((ns.slice(0, position).join('.')) + "." + name)
        .replace(/^\./, '');
    var projection = relocator(fullName);
    if (projection) {
        _b = splitContract(projection.toLowerCase()), ns = _b[0], name = _b[1];
        ns = ns.split('.');
        position = isBubbling ? ns.length : 0;
        fullName = ((ns.slice(0, position).join('.')) + "." + name)
            .replace(/^\./, '');
    }
    var descriptor = locator(fullName);
    if (!descriptor && ns.length) {
        position = position + (isBubbling ? -1 : 1);
        if (position >= 0 && position <= ns.length) {
            return lookup({ name: name, ns: ns, position: position, lookup: config.lookup }, locator, relocator);
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
function canActionDoCreate(base) {
    return (!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function';
}
/**
 * Returns the processed entity based on the defined DI.ACTIONS
 *
 * @private
 * @param {object} base descriptor
 * @returns {{instance: *, descriptor: *}}
 */
function createBaseInstance(base) {
    var _a;
    var instance;
    if (canActionDoCreate(base)) {
        instance = base.params ? (Array.isArray(base.params) ? new ((_a = base.ref).bind.apply(_a, [void 0].concat((base.params))))() : new base.ref(base.params)) : new base.ref();
    }
    else if (base.action === DI.ACTIONS.INVOKE) {
        instance = base.params ? (Array.isArray(base.params) ? base.ref.apply(base, (base.params)) : base.ref(base.params)) : base.ref();
    }
    else {
        instance = base.params ? Object.assign(base.ref, base.params) : base.ref;
    }
    return { instance: instance, descriptor: base };
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
function injectIntoBase(baseFullName, base, projections, instances, instance) {
    var _this = this;
    base.inject.forEach(function (dep) {
        var descriptor = _this.lookupDescriptor(projections[dep.name] || dep.name, { lookup: base.lookup });
        var fullName = fullNameFor(descriptor);
        if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
            throw Error("'" + fullName + "' has role '" + descriptor.role + "', which is not whitelisted by '" + baseFullName + "'");
        }
        else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
            throw Error("'" + fullName + "' has role '" + descriptor.role + "', which is blacklisted by '" + baseFullName + "'");
        }
        var injectable = dep.factory ? DI.getFactory(descriptor) :
            descriptor ? (instances[fullName] || (instances[fullName] = _this.get(descriptor, { instances: instances }))) : dep.name;
        if (typeof instance[dep.property] === 'function') {
            instance[dep.property](injectable);
        }
        else {
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
function createInstance(descriptor, config) {
    var instance;
    var instances = (descriptor.instances || {});
    // Make sure the original descriptor is not altered
    var base = Object.assign({ accept: [], reject: [], projections: {} }, descriptor, config);
    var baseFullName = fullNameFor(base);
    var projections = base.projections;
    instances[baseFullName] = createBaseInstance(base);
    instance = instances[baseFullName].instance;
    if (base.singleton) {
        descriptor.instance = instance;
    }
    else if (typeof base.ref === 'object') {
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
function inheritance(descriptor, config) {
    if (descriptor.inherit) {
        var parent_1 = this.lookupDescriptor(descriptor.inherit, config);
        descriptor = Object.assign({}, parent_1, descriptor);
        descriptor.inherit = parent_1.inherit;
        descriptor = inheritance.call(this, descriptor, config);
    }
    return descriptor;
}
