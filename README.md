![Get this with Bower](https://camo.githubusercontent.com/06c5d22b7908c0c4928071ac314e75c3da29d750/687474703a2f2f62656e7363687761727a2e6769746875622e696f2f626f7765722d6261646765732f62616467654032782e706e67)

[![Build Status][travis-url]][travis-image] [![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] 
[![Code Climate][code-climate-url]][code-climate-image]
[![Inline docs](http://inch-ci.org/github/scaljeri/javascript-dependency-injection.svg?branch=master&style=flat-square)](http://inch-ci.org/github/scaljeri/javascript-dependency-injection)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library 

You can find a demo, documentation and code coverage [here](http://scaljeri.github.io/javascript-dependency-injection/)

**DI-XXL** is a dependency injection library facilitating lazy initialization and loose coupling. To improve
the code you're writing even more, it is not possible to inject into the constructor; keep constructors 
empty or as small as possible. Although this may sound like a restriction, you will not miss it, because
it is an extremely versatile library; it provides many ways to implement dependency injection. Choose
whatever fits your needs best.

In its most basic form, to register an entity like a class, object or function do

    import {DI} from 'di-xxl';
    
    class Foo {}
    
    const descriptor = {
        name: 'foo',
        ref: Foo
    };
    
    DI.set(descriptor)
    
The `descriptor` object needs at least a `name` and a `ref`erence. Above `Foo` gets registered
and accessible by the name `foo`. Next, use `get` to retrieve an instance of `Foo` 

    const foo = DI.get('foo');
    
### Parameters
When parameters are required in order to create an instance, add the `params` array
    
    const descriptor = {
        name 'bar', 
        ref: Foo,
        params: [10, 20]
    }
    DI.set(descriptor);
    
The parameter `10` is used when none is given when the instane of Foo is requested

    DI.get('foo'); // -> new Foo(10, 20)

But when provided, the default parameters are ignored
    
    DI.get('foo', {params: [999]}); // -> new Foo(999)
    
### Injection 
In theory you can inject anything into almost everything :)  Circular dependencies do not exist, because it is not 
possible to inject into a constructor. So, to inject `foo` into an object do

    const app = {};
    
    const descriptor = {
        name: 'app',
        ref: app,
        inject: [{property: 'foo', name: 'foo'}]
    };
    
    ...
    
    const myApp = DI.get('app');
    myApp.foo instanceof Foo; // --> true
    

    myApp !== DI.get('app');  // is TRUE, because Object.create(app) is return 


### ACTIONS
It is also possible to register function (not constructors)

    const descriptor = {
        name: 'double',
        ref: num => num * 2,
        action: DI.ACTIONS.NONE
    };
    
    DI.set(descriptor);
    
The action `DI.ACTIONS.NONE` tells DI so simple return the original reference when it is requested

    const double = DI.get('double');
    double(10); // -> 20
    
In case of functions, we can take this even on step further

    const descriptor = {
        name: 'double',
        ref: base => num => base + num * 2,
        action: DI.ACTIONS.INVOKE
    }
    
This time DI wil invoke the reference using the provided parameters and return its output

    const double = DI.get('double', {params: [10]});
    double(2); // -> 14

### Singletons
To turn a class into a singleton, add the singleton flag to the descriptor

    const descriptor = {
        name: 'foo',
        ref: Foo,
        singleton: true
    }
    
### Inherit
TODO

### Factories
A class can produce instances of an other class
 
     class Bar {
         getFoo(input) {
             return new Foo(input);
         }
     }
     
In order to rewrite this using **DI-XXL**, Factories come to the rescue 

     class Bar {
         constructor(fooFactory) { this.fooFactory = fooFactory; }
          
         getFoo(input) { 
            return this.fooFactory(input);  
         }
     }
     
To re
and the relations are now defined as follows
 
     di.register('$bar', Bar, ['$fooFactory']);
     
     di.register('$foo', Foo);
     
That's all, the Foo-factory is created auto magically!
 
If you really want to create a factory yourself, you can
     
     di.register('$fooFactory', ['list', 'of', 'params'], { factoryFor: '$bar' });
     
### @Decorators    
As of this writing you have to use a couple of babel plugins to get `@decorators` working, but if you have
you can use **DI-XXL** as follows

    import {Injectable, Inject} from 'di-xxl';
    
    @Injectable()
    class Foo {
        sum(a, b) { return a + b }
    }
    
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

Note that this is equivalent to

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
    
    let bar = DI.getInstance('bar', {params: [100]});
    bar.add(1); // -> 101
    
However, if you need dependencies in the constructor you have a couple of ways to achieve this

### Inject into a constructor
Ok, if you really really really have to do this you can still do it. For example, if you need to 
inject `Foo` into `Bar`

    const bar = DI.get('bar', {params: [DI.get('foo')]});
    



For more advanced use-cases checkout the [unit tests](https://github.com/scaljeri/javascript-dependency-injection/blob/master/test/di.spec.js)
file.

#### Installation ####

Install this library with `npm` 

    $> npm install --save javascript-dependency-injection@beta
    
or

    $> bower install javascript-dependency-injection#2.0.0-rc.1
    
#### Unit testing ####

    $> npm test
    
#### Documentation ####

    $> npm run doc
    
### Run in the browser
If you want to run this library in the browser, and you have, for example, included it in
main.js, you can browserify it using [babelify](https://github.com/babel/babelify) as follows:

    $> ./node_modules/.bin/browserify main.js -o bundle.js -t [ babelify --presets [ es2015 stage-0 ] ]
    
    
TODO
         * Projections: They map dependencies to others. For example
         *
         *     @Inject('Bar')
         *     service
         *
         * can be projected and inject 'Maz'
         *
         *     di.setProjection({Bar: 'Maz'});

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
