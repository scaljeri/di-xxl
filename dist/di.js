"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DESCRIPTORS = new Map();
var PROJECTIONS = new Map();
function Injectable(descriptor) {
    var settings = descriptor ? (typeof descriptor === 'string' ? { name: descriptor } : descriptor) : {};
    return function decorator(ref) {
        var descriptor = Object.assign(DESCRIPTORS.get(ref) || {}, settings);
        DESCRIPTORS.delete(ref);
        descriptor.ref = ref;
        if (typeof ref === 'object' && descriptor.singleton === undefined) {
            descriptor.singleton = true;
        }
        if (!descriptor.name) {
            descriptor.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        }
        else {
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
var DI = (function () {
    function DI(descriptor) {
        if (descriptor === void 0) { descriptor = {}; }
        this.defaults = Object.assign({ lookup: DI.DIRECTIONS.PARENT_TO_CHILD }, descriptor);
        this.projections = new Map();
        this.descriptors = new Map();
    }
    Object.defineProperty(DI, "DIRECTIONS", {
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
    DI.getDescriptor = function (name, ns, descriptor) {
        if (descriptor === void 0) { descriptor = DESCRIPTORS; }
        return descriptor.get(fullNameFor({ name: name, ns: ns }));
    };
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
    DI.getProjection = function (name, ns, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        return projections.get(fullNameFor({ name: name, ns: ns }));
    };
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
    DI.setProjection = function (list, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        for (var key in list) {
            if (list.hasOwnProperty(key)) {
                projections.set(key.toLowerCase(), list[key]);
            }
        }
        return this;
    };
    DI.removeProjection = function (key, projections) {
        if (projections === void 0) { projections = PROJECTIONS; }
        projections.delete(key.toLowerCase());
        return this;
    };
    DI.removeDescriptor = function (name, ns, descriptors) {
        if (descriptors === void 0) { descriptors = DESCRIPTORS; }
        descriptors.delete(fullNameFor({ name: name, ns: ns }));
        return this;
    };
    DI.set = function (descriptor) {
        Injectable(descriptor).call(this, descriptor.ref);
        return this;
    };
    DI.prototype.getDescriptor = function (name, ns) {
        var descriptor = DI.getDescriptor(name, ns, this.descriptors);
        if (descriptor === undefined) {
            descriptor = DI.getDescriptor(name, ns);
        }
        return descriptor;
    };
    DI.prototype.lookupDescriptor = function (name, config) {
        return DI.lookupDescriptor.call(this, name, config);
    };
    DI.prototype.getProjection = function (name, ns) {
        var projection = DI.getProjection(name, ns, this.projections);
        if (projection === undefined) {
            projection = DI.getProjection(name, ns);
        }
        return projection;
    };
    DI.prototype.setProjection = function (list) {
        DI.setProjection(list, this.projections);
        return this;
    };
    DI.prototype.removeProjection = function (key) {
        this.projections.set(key.toLowerCase(), null);
        return this;
    };
    DI.prototype.removeDescriptor = function (name) {
        this.descriptors.set(fullNameFor({ name: name }), null);
        return this;
    };
    DI.prototype.get = function (name, config) {
        return DI.get.call(this, name, config);
    };
    DI.prototype.set = function (descriptor) {
        return DI.set.call(this, descriptor);
    };
    DI.prototype.getFactory = function (name, config) {
        return DI.getFactory(name, config);
    };
    return DI;
}());
exports.DI = DI;
function splitContract(fullName) {
    var parts = fullName.split(/\.|:/);
    var name = parts.pop();
    return [(parts.join('.') || ''), name];
}
function fullNameFor(descriptor) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? descriptor.ns + "." : '') + descriptor.name).toLowerCase() : null;
}
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
function canActionDoCreate(base) {
    return (!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function';
}
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
function createInstance(descriptor, config) {
    var instance;
    var instances = (descriptor.instances || {});
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
function inheritance(descriptor, config) {
    if (descriptor.inherit) {
        var parent_1 = this.lookupDescriptor(descriptor.inherit, config);
        descriptor = Object.assign({}, parent_1, descriptor);
        descriptor.inherit = parent_1.inherit;
        descriptor = inheritance.call(this, descriptor, config);
    }
    return descriptor;
}
