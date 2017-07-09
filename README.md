![Get this with Bower](https://camo.githubusercontent.com/06c5d22b7908c0c4928071ac314e75c3da29d750/687474703a2f2f62656e7363687761727a2e6769746875622e696f2f626f7765722d6261646765732f62616467654032782e706e67)

[![Build Status][travis-url]][travis-image] [![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] 
[![Code Climate][code-climate-url]][code-climate-image]
[![Inline docs](http://inch-ci.org/github/scaljeri/javascript-dependency-injection.svg?branch=master&style=flat-square)](http://inch-ci.org/github/scaljeri/javascript-dependency-injection)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library written in ES2015 

You can find a demo, documentation and code coverage [here](http://scaljeri.github.io/javascript-dependency-injection/)

**DI-XXL** is a dependency injection library facilitating lazy initialization and loose coupling
--> maintainable code! 

In order to keep constructor functions as small as possible (Best practice!!) it is not possible
to inject something into a constructor. 
 
To add, for example, a class to **DI-XXL** you have to define a so called descriptor object

    import {DI} from 'di-xxl';
    
    class Foo {}
    
    DI.register('foo', 
        { // Descriptor object
            ref: Foo
        }
    );
    
The descriptor object is stored by a name, in this case `foo`. Now, to retrieve an instance of the class `Foo` 
simply do

    const foo = DI.getInstance('foo');
    
### Injection 
In theory you can inject anything into almost anything :)  Circular dependencies do not exist, because it is not 
possible to inject into a constructor function. 

For example, to inject an instance of `Foo` into an object you describe this into the descriptor

    class Foo {}
    const app = {};
    
    DI.register('app', {
        ref: app,
        inject: [{propertyName: 'xyz', descriptor: 'foo'}]
    }
    DI.register('foo', {
        ref: Foo
    });

Is that all? Yes that's all :) and you're ready to rumble

    const myApp = DI.get('app');
    myApp.xyz.msg = 'Hello world';
    

### @Decorators    

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
    
This will register the classes and can be used right away

    import {ID} from 'di-xxl';
    
    let bar = DI.getInstance('bar', {params: [100]});
    bar.add(1); // -> 101
    
If @Decorators is not yet an option, you can register your classes yourself

    DI.register('foo', {
      ref: Foo
    );
   
    DI.register('bar', {
      ref: Bar,
      inject: [{propertyName: 'addService', contractName: 'foo']
    })
     
NOTE: It is not possible to inject into a constructor, 

However, if you need dependencies in the constructor you have a couple of ways to achieve this

#### Example 2

    class Bar {
        constructor(base) {
            this.total = this.inject.$foo.add(0, base); // Here the dependency is used!
        }
         
        add(val) {
            this.total = this.inject.$foo.sum(this.total, val);
        }
    }
    di.register('$bar', Bar, {inject: ['$foo']});
    
Or you can do the following

#### Example 3

    class Bar { 
        constructor($foo, base) {
            this.$foo = $foo;     // $foo instanceof Foo (injected)
            this.total = base;
        }
        
        add(val) {
            this.total = this.$foo.sum(this.total, val);
        }
    }
    di.register('$bar', Bar);
    
    let bar = di.getInstance('$bar', 100);
    bar.add(1); // bar.total === 101
    
This time **DI-XXL** doesn't know what do to, in which case it extracts and inspects the constructor arguments.

This pattern can be extended to the instance methods too

#### Example 3

    class Bar {
        constructor(base) { this.total = base; }
      
        add($foo, val) {
          this.total = $foo.sum(this.total, val);
        }
    }
    di.register('$bar', Bar, { augment: true }); // or a list of instance methods
    
    let bar = di.getInstance('$bar', 10);
    bar.add(100); // -> bar.total === 110
    

It is also possible to define the constructor arguments yourself

#### Example 4

    class Bar {
      constructor(someInstance, someValue) {
          this.someInstance = someInstance;
          this.someValue = someValue;
      }
      ...
    }

    di.register('$bar', Bar, ['$foo' ,100]);
    var bar = di.getInstance('$bar');
    bar.someInstance instanceOf Foo
    bar.someValue === 100;
       
Checkout the unit tests for more advanced examples
       
### Singletons
**DI** can also return the same instance (singleton)
 
     di.register('$bar', Bar, { singleton: true });
     di.getInstance('$bar') === di.getInstance('$bar')
     
### Factories
A class can produce instances of an other class
 
     class Bar {
         getFoo(input) {
             return new Foo(input);
         }
     }
     
In order to rewrite this using DI, Factories come to the rescue 

     class Bar {
         constructor(fooFactory) { this.fooFactory = fooFactory; }
          
         getFoo(input) { 
            return this.fooFactory(input);  
         }
     }
     
and the relations are now defined as follows
 
     di.register('$bar', Bar, ['$fooFactory']);
     
     di.register('$foo', Foo);
     
That's all, the Foo-factory is created auto magically!
 
If you really want to create a factory yourself, you can
     
     di.register('$fooFactory', ['list', 'of', 'params'], { factoryFor: '$bar' });
     
## Parameters 
Now things get a bit tricky, because parameters can be set at different places and
some kind of parameter-inheritance happens. The first level of where parameters can be defined is 
with `register`

    di.register('$bar', Bar, ['$foo', 
For example
 
     di.register('$bar', Bar, ['p1', 'p2', 'p3', 'p4']);
     let bar = di.getInstance('$bar', 'p5', 'p6', 'p7');
     
The `getInstance` method accepts constructor arguments too. The above is equivalent o
    
      new Bar('p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7');
      
The parameters are added. But what if you like to replace the initial parameter?
  
     di.register('$bar', Bar, ['p1', 'p2', 'p3', 'p4'], { writable: true });
     let bar = di.getInstance('$bar', 'p5', 'p6', 'p7');
 
This time the constructor arguments are
 
     'p5', 'p6', 'p7', 'p4'
     
Important to note here is that an initial parameter is only replaced if the 
new parameter not equals `undefined`. 
  
With factories, you have this behavior too, but also an extra inheritance layer. 
Check this out

    di.register('$barFactory', ['p1', 'p2', 'p3', 'p4', 'p5'], { factoryFor: '$bar' });    
    let barFactory = di.getInstance('$barFactory', 'p6', 'p7');                            
    let bar = barFactory('p8', 'p9');  // bar is initialized with 'p1', 'p2', ...., 'p9'   
    
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
