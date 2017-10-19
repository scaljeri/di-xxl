[![CircleCI](https://circleci.com/gh/scaljeri/di-xxl/tree/master.svg?style=svg)](https://circleci.com/gh/scaljeri/di-xxl/tree/master) [![Inline docs](http://inch-ci.org/github/scaljeri/di-xxl.svg?branch=master)](http://inch-ci.org/github/scaljeri/di-xxl) [![Coverage Status](https://coveralls.io/repos/github/scaljeri/di-xxl/badge.svg?branch=master)](https://coveralls.io/github/scaljeri/di-xxl?branch=master) 
[![Code Climate][code-climate-image]][code-climate-url]

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library 

You can find a demo, documentation and code coverage [here](http://scaljeri.github.io/di-xxl/)

**DI-XXL** is a dependency injection library facilitating lazy initialization and loose coupling. 
It is generic, because it can inject everything into anything in multiple ways. Together with support 
for namespaces, decorators, factory functions and projections it is a powerful tool ready for complex situations.

In its most basic form a registration of an entity like a class, object or function is done like this

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
Above, the instance was created without parameters, but they can be added to the descriptor object as well
    
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
        
### ACTIONS
Anything can be registered, like classes, objects, but also normal functions (not constructors).
If a function is not a constructor you need to instruct **DI-XXL** what it should; return the function or call it first
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
    
In the last example **DI-XXL** will invoke the reference using the provided parameters and return the output

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
    
But if you set that flag to false, **DI-XXL** returns a new object, internally using `Object.create`
    
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

The factory function, which produces instances of `Foo` is injected into the `creator` property of `bar`

### Projections
Projections let you map an entity name to an other

    DI.setProjection({'foo': 'bar'})

    const something = DI.get('foo'); 
    
results in `something instanceof Bar`. Projections can be used, for example, to change the behaviour of you application 
dynamically, based on user action.

### Namespaces
Namespaces help to structure your entities in a descriptive way. A namespace is a prefix of the entity name

    user.overview.profile
    
with `user.overview` being the namespace. Try to keep your entity names unique within the whole namespace. For example

    user.profile
    user.overview.profile
    
`profile` is not unique!! As long as you know what your are doing this isn't a problem. The reason behind this is how 
namespaces are implemented:
 
    class User { ... }
    
    DI.set({ 
        name: 'user.overview.profile', 
        ref: User,
        inject: [
            {property: 'list', name: 'user.widgets.list'},
            {property: 'source', name: 'user.data.source'}]});
        
    DI.get('user.overview.profile');
  
The `list` and `source` entities, although exactly specified, will be searched for within the namespace from the root up.
It means that **DI-XXL** will look for `list` using the following names

    list               --> no
    user.list          --> no
    user.widgets.list  --> yes
    
This allows you to redefine entities without replacing the original

    DI.set({ name: 'user.list', ....});
    
This time the the search for `list` looks like

    list       --> no
    user.list  --> yes
    
It will not find `user.widgets.list`. It is best used preferably only during initialization.
This is the default lookup direction (`DI.DIRECTIONS.PARENT_TO_CHILD), but you can reverse the lookup

    DI.get('user.overview.profile', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
    
So far we have only talked about the entities from the `inject` list, but this search pattern is also applied on the entity request, 
with one exception, the first attempt is always the exact name provided

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
but if you have them enabled you can use **DI-XXL** as follows

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
    
    
The `@Injectable` statements are directly executed, meaning that they are immediately available

    import {ID} from 'di-xxl';
    
    let bar = DI.get('bar', {params: [100]});
    bar.add(1); // -> 101
    
Checkout the unit tests fixtures [file](https://github.com/scaljeri/di-xxl/blob/master/test/fixtures/decorators.js) for more advanced use cases

### Inject into a constructor
Ok, if you really really really have to do this you can of course do it ... yourself :)

    const params = [DI.get('foo'), 10];
    const bar = DI.get('bar', {params});
    
 
### More information
A lot more advanced use-cases are available inside the [unit test](https://github.com/scaljeri/javascript-dependency-injection/blob/master/test/di.spec.js) files.

#### Installation ####

Install this library with `yarn` or `npm`

    $> yarn add di-xxl
    
    $> npm install di-xxl
    
#### Commands ####
Convert **DI--XXL into  an UMD and ES5 library + a minified version in `./dist` 

    $> yarn build
    
Unit testing

    $> yarn test
    
Linting

    $> yarn lint
    
Generate documentation (jsdoc)

    $> yarn doc
    
Run benchmarks on different aspects of **DI-XXL**

    $> yarn bench 

    
#### Documentation ####

    $> yarn doc
    
### Run in the browser
There are a couple of ways to run this library in the browser. 

  a) If you use `import` or `require` in you project
  
    import { DI } from 'di-xxl';
   
    var di = require('di-xxl');
   
   you need to `browserify` it first using [babelify](https://github.com/babel/babelify) 
   
    $> ./node_modules/.bin/browserify ./src/di.js -o bundle.js -t [ babelify --presets [ es2015 stage-0 ] ]
    
  b) If you use [RequireJS](http://requirejs.org/) you should use the [UMD](https://github.com/umdjs/umd) file which you can find inside the `dist` directory
  
  
Checkout the [demo](https://github.com/scaljeri/di-xxl/tree/gh-pages) ([main.js](https://github.com/scaljeri/di-xxl/blob/gh-pages/main.js))
    
[coveralls-image]: https://coveralls.io/github/scaljeri/javascript-dependency-injection?branch=master
[coveralls-url]: https://coveralls.io/repos/github/scaljeri/javascript-dependency-injection/badge.svg?branch=master

[depstat-url]: https://david-dm.org/scaljeri/di-xxl
[depstat-image]: https://david-dm.org/scaljeri/di-xxl.svg

[_depstat-dev-url]: https://david-dm.org/scaljeri/di-xxl#info=devDependencies
[_depstat-dev-image]: https://david-dm.org/scaljeri/di-xxl.svg#info=devDependencies

[depstat-dev-url]: https://david-dm.org/scaljeri/di-xxl#info=devDependencies
[depstat-dev-image]: https://david-dm.org/scaljeri/di-xxl/dev-status.svg

[code-climate-image]: https://codeclimate.com/github/scaljeri/di-xxl/badges/gpa.svg
[code-climate-url]: https://codeclimate.com/github/scaljeri/di-xxl


[coveralls-image]: https://coveralls.io/repos/github/scaljeri/di-xxl/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/scaljeri/di-xxl?branch=master

