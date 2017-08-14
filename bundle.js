(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.Injectable = Injectable;
exports.Inject = Inject;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DESCRIPTORS = new Map(),
    PROJECTIONS = new Map();

function Injectable(descriptor) {
    var settings = descriptor ? typeof descriptor === 'string' ? { name: descriptor } : descriptor : {};

    return function decorator(ref) {
        var descriptor = Object.assign(DESCRIPTORS.get(ref) || {}, settings);
        DESCRIPTORS.delete(ref);

        descriptor.ref = ref;

        if ((typeof ref === 'undefined' ? 'undefined' : _typeof(ref)) === 'object' && descriptor.singleton === undefined) {
            descriptor.singleton = true;
        }

        if (!descriptor.name) {
            descriptor.name = ref.name.charAt(0).toLowerCase() + ref.name.substring(1);
        } else {
            var _splitContract = splitContract(descriptor.name),
                _splitContract2 = _slicedToArray(_splitContract, 2),
                ns = _splitContract2[0],
                name = _splitContract2[1];

            descriptor.name = name.toLowerCase();

            if (ns) {
                descriptor.ns = ns.toLowerCase();
            }
        }

        ((this || {}).descriptors || DESCRIPTORS).set(fullNameFor(descriptor).toLowerCase(), descriptor);
    };
}

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

var DI = exports.DI = function () {
    _createClass(DI, null, [{
        key: 'ACTIONS',
        get: function get() {
            return {
                CREATE: 0,
                INVOKE: 1,
                NONE: 2
            };
        }
    }]);

    function DI() {
        var descriptor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, DI);

        this.defaults = Object.assign({ lookup: DI.DIRECTIONS.PARENT_TO_CHILD }, descriptor);

        this.projections = new Map();
        this.descriptors = new Map();
    }

    _createClass(DI, [{
        key: 'getDescriptor',
        value: function getDescriptor(name, ns) {
            return DI.getDescriptor(name, ns, this.descriptors) || DI.getDescriptor(name, ns);
        }
    }, {
        key: 'lookupDescriptor',
        value: function lookupDescriptor(name, config) {
            return DI.lookupDescriptor.call(this, name, config);
        }
    }, {
        key: 'getProjection',
        value: function getProjection(name, ns) {
            return DI.getProjection(name, ns, this.projections) || DI.getProjection(name, ns);
        }
    }, {
        key: 'setProjection',
        value: function setProjection(list) {
            DI.setProjection(list, this.projections);

            return this;
        }
    }, {
        key: 'removeProjection',
        value: function removeProjection(key) {
            DI.removeProjection(key, this.projections);

            return this;
        }
    }, {
        key: 'removeDescriptor',
        value: function removeDescriptor(name, ns) {
            DI.removeDescriptor(name, ns, this.descriptors);

            return this;
        }
    }, {
        key: 'get',
        value: function get(name, config) {
            return DI.get.call(this, name, config);
        }
    }, {
        key: 'set',
        value: function set(descriptor) {
            return DI.set.call(this, descriptor);
        }
    }, {
        key: 'getFactory',
        value: function getFactory(name, config) {
            return DI.getFactory(name, config);
        }
    }], [{
        key: 'getDescriptor',
        value: function getDescriptor(name, ns) {
            var descriptor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DESCRIPTORS;

            return descriptor.get(fullNameFor({ name: name, ns: ns }));
        }
    }, {
        key: 'lookupDescriptor',
        value: function lookupDescriptor(name) {
            var _this = this;

            var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var settings = Object.assign({}, this.defaults, config, { name: name });

            var descriptor = lookup(settings, function (name) {
                return _this.getDescriptor(name);
            }, function (name) {
                return _this.getProjection(name);
            });

            return descriptor;
        }
    }, {
        key: 'getProjection',
        value: function getProjection(name, ns) {
            var projections = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PROJECTIONS;

            return projections.get(fullNameFor({ name: name, ns: ns }));
        }
    }, {
        key: 'setProjection',
        value: function setProjection(list) {
            var projections = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : PROJECTIONS;

            for (var key in list) {
                projections.set(key.toLowerCase(), list[key]);
            }

            return this;
        }
    }, {
        key: 'removeProjection',
        value: function removeProjection(key) {
            var projections = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : PROJECTIONS;

            projections.delete(key.toLowerCase());

            return this;
        }
    }, {
        key: 'removeDescriptor',
        value: function removeDescriptor(name, ns) {
            var descriptors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DESCRIPTORS;

            descriptors.delete(fullNameFor({ name: name, ns: ns }));

            return this;
        }
    }, {
        key: 'get',
        value: function get(name, config) {
            var descriptor = typeof name === 'string' ? this.lookupDescriptor(name, config) : name;
            var instance = null;

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
    }, {
        key: 'set',
        value: function set(descriptor) {
            Injectable(descriptor).call(this, descriptor.ref);

            return this;
        }
    }, {
        key: 'getFactory',
        value: function getFactory(name) {
            var _this2 = this;

            var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { params: [] };


            var descriptor = Object.assign({}, typeof name === 'string' ? this.lookupDescriptor(name, config) || {} : name, config);

            return function () {
                for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
                    params[_key] = arguments[_key];
                }

                return _this2.get(params.length ? Object.assign(descriptor, { params: params }) : descriptor);
            };
        }
    }]);

    return DI;
}();

DI.DIRECTIONS = {
    PARENT_TO_CHILD: 1,
    CHILD_TO_PARENT: 2
};

function splitContract(fullName) {
    var parts = fullName.split(/\.|:/);
    var name = parts.pop();

    return [parts.join('.') || '', name];
}

function fullNameFor(descriptor) {
    return descriptor ? (typeof descriptor === 'string' ? descriptor : (descriptor.ns ? descriptor.ns + '.' : '') + descriptor.name).toLowerCase() : null;
}

function lookup(config, locator, relocator) {
    var name = void 0,
        ns = void 0,
        position = void 0;

    name = config.name;
    ns = config.ns;
    position = config.position;


    var isBubbling = config.lookup !== DI.DIRECTIONS.PARENT_TO_CHILD;

    if (ns === undefined) {
        var _splitContract3 = splitContract(name.toLowerCase());

        var _splitContract4 = _slicedToArray(_splitContract3, 2);

        ns = _splitContract4[0];
        name = _splitContract4[1];

        ns = ns.split('.');
        position = isBubbling ? ns.length : 0;
    }

    var fullName = (ns.slice(0, position).join('.') + '.' + name).replace(/^\./, '');

    var projection = relocator(fullName);

    if (projection) {
        var _splitContract5 = splitContract(projection.toLowerCase());

        var _splitContract6 = _slicedToArray(_splitContract5, 2);

        ns = _splitContract6[0];
        name = _splitContract6[1];

        ns = ns.split('.');
        position = lookup ? ns.length : 0;

        fullName = (ns.slice(0, position).join('.') + '.' + name).replace(/^\./, '');
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

function createInstance(descriptor, config) {
    var _this3 = this;

    var instance = void 0,
        instances = descriptor.instances || {};

    var base = Object.assign({ accept: [], reject: [], params: [], projections: {} }, descriptor, config),
        baseFullName = fullNameFor(base),
        projections = base.projections;

    if (base.ref) {
        if ((!base.action || base.action === DI.ACTIONS.CREATE) && typeof base.ref === 'function') {
            instance = Array.isArray(base.params) ? new (Function.prototype.bind.apply(base.ref, [null].concat(_toConsumableArray(base.params || []))))() : new base.ref(base.params);
        } else if (base.action === DI.ACTIONS.INVOKE) {
            instance = Array.isArray(base.params) ? base.ref.apply(base, _toConsumableArray(base.params || [])) : base.ref(base.params);
        } else {
            instance = base.params ? Object.assign(base.ref, base.params) : base.ref;
        }

        if (base.singleton) {
            descriptor.instance = instance;
        } else if (_typeof(base.ref) === 'object') {
            instance = Object.create(base.ref);
        }

        instances[baseFullName] = { instance: instance, descriptor: base };
    }

    if ((base.inject || []).length) {
        base.inject.forEach(function (dep) {
            var descriptor = _this3.lookupDescriptor(projections[dep.name] || dep.name),
                fullName = fullNameFor(descriptor);

            if (base.accept.length && !~base.accept.indexOf(descriptor.role)) {
                throw Error('\'' + fullName + '\' has role \'' + descriptor.role + '\', which is not whitelisted by \'' + baseFullName + '\'');
            } else if (base.reject.length && ~base.reject.indexOf(descriptor.role)) {
                throw Error('\'' + fullName + '\' has role \'' + descriptor.role + '\', which is blacklisted by \'' + baseFullName + '\'');
            }

            var injectable = void 0;
            if (dep.factory) {
                injectable = DI.getFactory(descriptor);
            } else {
                injectable = descriptor ? instances[fullName] || (instances[fullName] = _this3.get(descriptor, { instances: instances })) : dep.name;
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
        var parent = this.lookupDescriptor(descriptor.inherit, config);
        descriptor = Object.assign({}, parent, descriptor);

        if (parent.inherit) {
            descriptor = inheritance.call(this.descriptor, config);
        }
    }

    return descriptor;
}

},{}],2:[function(require,module,exports){
'use strict';

var _di = require('./di');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Foo = function Foo() {
    _classCallCheck(this, Foo);

    this.args = arguments;
};

var Bar = function Bar($foo) {
    _classCallCheck(this, Bar);

    this.args = arguments;
};

_di.DI.set({ name: 'foo', ref: Foo, singleton: true });
_di.DI.set({ name: 'bar', ref: Bar, inject: [{ property: 'foo', factory: true, name: 'foo' }] });
_di.DI.set({ name: 'baz', ref: Bar });

var bar = _di.DI.get('bar', { params: [100] });
var foo = _di.DI.get('foo');

window.Foo = Foo;
window.Bar = Bar;
window.bar = bar;
window.foo = foo;
window.DI = _di.DI;
console.log('READY');

},{"./di":1}]},{},[2]);
