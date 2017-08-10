![Get this with Bower](https://camo.githubusercontent.com/06c5d22b7908c0c4928071ac314e75c3da29d750/687474703a2f2f62656e7363687761727a2e6769746875622e696f2f626f7765722d6261646765732f62616467654032782e706e67)

[![Build Status][travis-url]][travis-image] [![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] 
[![Code Climate][code-climate-url]][code-climate-image]
[![Inline docs](http://inch-ci.org/github/scaljeri/javascript-dependency-injection.svg?branch=master&style=flat-square)](http://inch-ci.org/github/scaljeri/javascript-dependency-injection)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library 

You can find a demo, documentation and code coverage [here](http://scaljeri.github.io/di-xxl/)

**DI-XXL** is a dependency injection library facilitating lazy initialization and loose coupling. 
It is generic, because it can inject everything into anything in multiple ways. Together with support 
for namespaces, decorators, factory functions and projections it is a powerful tool ready for complex situations.

In its most basic form, to register an entity like a class, object or function looks like this

    import {DI} from 'di-xxl';
    
    class Foo {}
    
    const descriptor = {
        name: 'foo',
        ref: Foo
    };
    
    DI.set(descriptor)
    
`Foo` gets registered here and will be accessible by the name `foo`. The `descriptor` object needs at least 
a `name` and a `ref`erence. Next, use `get` to retrieve an instance of `Foo` 

    const foo = DI.get('foo');
    
### Parameters
Above, the instance was created without parameters. In order to add default parameters, define
the `params` array
    
    const descriptor = {
        name 'foo', 
        ref: Foo,
        params: [10, 20]
    }
    DI.set(descriptor);
    
These `params` will be used when none are given when the instance of Foo is requested

    DI.get('foo'); // -> new Foo(10, 20)

But when provided, the default parameters are ignored
    
    DI.get('foo', {params: [999]}); // -> new Foo(999)
    
    
### Injection 
In theory you can inject anything into almost everything :)  Circular dependencies do not exist, because it is not 
possible to inject into a constructor. Keep your constructors empty or as small as possible! 
    
So, to inject `foo` into an object do
    
    const app = {};
        
    const descriptor = {
        name: 'app',
        ref: app,
        inject: [{property: 'foo', name: 'foo'}]
    };
    DI.set(descriptor);
        
      
    const myApp = DI.get('app');
    myApp.foo instanceof Foo; // --> true
        
    myApp !== DI.get('app');  // is TRUE, because Object.create(app) is return 
    
### ACTIONS
Because anything can be registered, like classes, objects, but also normal functions (not constructors).
If a function is not a constructor you have to tell **DI-XXL** what it should, return the function or call it
and return the output

    const descriptor = {
        name: 'double',
        ref: num => num * 2,
        action: DI.ACTIONS.NONE
    };
    
    DI.set(descriptor);
    
    const double = DI.get('double');
    double(10); // -> 20
    
or

    const descriptor = {
        name: 'double',
        ref: base => num => base + num * 2,
        action: DI.ACTIONS.INVOKE
    }
    
This time **DI-XXL** will invoke the reference using the provided parameters and return its output

    const double = DI.get('double', {params: [10]});
    double(2); // -> 14

### Singletons
To turn a class into a singleton, add the singleton flag to the descriptor

    const descriptor = {
        name: 'foo',
        ref: Foo,
        singleton: true
    }
    
This will also work with Objects. By default (if not specified) on object is a singleton

    const descriptor = {
        name: 'app',
        ref: {}
    }
    DI.set(descriptor);
    
    let app = DI.get('app')
    app.count = 1
    app = DI.get('app');
    console.log(app.count); // -> 1
    
But if you set it to false, **DI-XXL** returns a new object, using internally `Object.create`, each time
    
    const descriptor = {
        name: 'app',
        ref: {},
        singleton: false
    }
    DI.set(descriptor);
    
    let app = DI.get('app')
    app.count = 1
    app = DI.get('app');
    console.log(app.count); // -> undefined
    
### Inherit
In case you have almost identical descriptors for two different entities, one can inherit the other

    descriptor = {
        name: 'Bar',
        ref: Bar,
        inherit: 'foo'
    }

### Factories
When a class produce instances of an other class
 
     class Bar {
         getFoo(input) {
             return new Foo(input);
         }
     }
     
it can be rewritten with **DI-XXL** using Factories

    class Bar {
        getInstance() {
            return this.creator();
        }        
    }
     
    descriptor = {
        name: 'bar',
        ref: Bar,
        inject: [{property: 'creator', factory: 'foo'}]
    }

**DI-XXL** creates a factory function which produces instances of Foo and injects it.

### Projections
Projections let you map an entity name to an other

    DI.setProjection({'foo': 'bar'})

    const something = DI.get('foo'); 
    
an instance of `bar` is returned. Projections can be used, for example, to change the behaviour of you application 
dynamically, based on user action.

### Namespaces
Namespaces help to structure your entities in a very descriptive way and is nothing more than a prefix of the entity name

    user.overview.profile
    
with `user.overview` being the namespace. To begin with, try to keep your entity names unique. For example

    user.profile
    user.overview.profile
    
`profile` is not unique!! As long as you know what your are doing this isn't a problem. The reason for this is how 
namespaces are implemented. For example 
 
    class User { ... }
    
    DI.set({ 
        name: 'user.overview.profile', 
        ref: User,
        inject: [
            {property: 'list', name: 'user.widgets.list'},
            {property: 'source', name: 'user.data.source'}]});
        
    DI.get('user.overview.profile');
  
The `list` and `source` entities, although exactly specified, they are searched for within the namespace from the root up.
It means that **DI-XXL** will look for `list` using the following names

    list               --> no
    user.list          --> no
    user.widgets.list  --> yes
    
This allows you to redefine entities

    DI.set({ name: 'list', ns: 'user', ....});
    
This time the the search for `list` looks like

    list       --> no
    user.list  --> yes
    
And will not find `user.widgets.list`. It is best used preferably only during initialization.
So, this is the default lookup direction  (`DI.DIRECTIONS.PARENT_TO_CHILD), but you can reverse the lookup

    DI.get('user.overview.profile', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
    
So far we have only talked about the entities from the `inject` list, but this search pattern is also applied on the entity request, 
with one exception, the first attempt is always the name provided

    // DI.DIRECTIONS.CHILD_TO_PARENT
       user.overview.profile
       user.profile
       profile
       
    // DI.DIRECTIONS.PARENT_TO_CHIDL
       user.overview.profile
       profile
       user.profile

### @Decorators    
As of this writing you have to use a couple of babel plugins to get `@decorators` up and running, 
but if you have you can use **DI-XXL** as follows

    import {Injectable, Inject} from 'di-xxl';
    
    @Injectable({name: 'foo'})
    class Foo {
        sum(a, b) { return a + b }
    }
    
    @Injectable({name: 'Bar'})
    class Bar {
        @Inject('foo')
        addService
        
        constructor(base = 0) {
            this.total = base;
        }
         
        add(val) {
            return this.addService(this.base, val);
        }
    }

Which is equivalent to

    import {ID} from 'di-xxl';
    
    DI.set({
        name: 'foo',
        ref: Foo
    });
    
    DI.set({
        name: 'bar',
        ref: Bar,
        inject: [{property: 'addService', name: 'foo'}]
    });
    
    
After registration they can be used as follows

    import {ID} from 'di-xxl';
    
    let bar = DI.get('bar', {params: [100]});
    bar.add(1); // -> 101
    
TODO: Checkout the unit tests fixtures for more advanced use cases

### Inject into a constructor
Ok, if you really really really have to do this you can of course do it ... yourself :)

    const params = [DI.get('foo'), 10];
    const bar = DI.get('bar', {params});
    
 
### More information
For more advanced use-cases checkout the [unit tests](https://github.com/scaljeri/javascript-dependency-injection/blob/master/test/di.spec.js)
file.

TODO: DEMO link

#### Installation ####

Install this library with `yarn` 

    $> yarn add di-xxl@beta
    
#### Unit testing ####

    $> yarn test
    
#### Documentation ####

    $> yarn doc
    
### Run in the browser
If you want to run this library in the browser build it with browserify using [babelify](https://github.com/babel/babelify) 
as follows

    $> ./node_modules/.bin/browserify main.js -o bundle.js -t [ babelify --presets [ es2015 stage-0 ] ]
    
[travis-url]: https://travis-ci.org/scaljeri/javascript-dependency-injection.png
[travis-image]: https://travis-ci.org/scaljeri/javascript-dependency-injection

[coveralls-image]: https://coveralls.io/github/scaljeri/javascript-dependency-injection?branch=master
[coveralls-url]: https://coveralls.io/repos/github/scaljeri/javascript-dependency-injection/badge.svg?branch=master

[depstat-url]: https://david-dm.org/scaljeri/javascript-dependency-injection
[depstat-image]: https://david-dm.org/scaljeri/javascript-dependency-injection.svg

[_depstat-dev-url]: https://david-dm.org/scaljeri/javascript-dependency-injection#info=devDependencies
[_depstat-dev-image]: https://david-dm.org/scaljeri/javascript-dependency-injection.svg#info=devDependencies

[depstat-dev-url]: https://david-dm.org/scaljeri/javascript-dependency-injection#info=devDependencies
[depstat-dev-image]: https://david-dm.org/scaljeri/javascript-dependency-injection/dev-status.svg

[code-climate-url]: https://codeclimate.com/github/scaljeri/javascript-dependency-injection/badges/gpa.svg
[code-climate-image]: https://codeclimate.com/github/scaljeri/javascript-dependency-injection
