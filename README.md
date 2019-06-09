[![CircleCI](https://circleci.com/gh/scaljeri/di-xxl/tree/master.svg?style=svg)](https://circleci.com/gh/scaljeri/di-xxl/tree/master) [![Inline docs](http://inch-ci.org/github/scaljeri/di-xxl.svg?branch=master)](http://inch-ci.org/github/scaljeri/di-xxl) [![Coverage Status](https://coveralls.io/repos/github/scaljeri/di-xxl/badge.svg?branch=master)](https://coveralls.io/github/scaljeri/di-xxl?branch=master) 

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library 

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

    const foo = DI.get('foo'); // const foo = new Foo();
    
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
    
    DI.get<Foo>('foo', {params: [999]}); // -> Returns new Foo(999)
    
In the above example, `DI.get` is typed, telling it what the returned value is, to make consuming the output easier and more obvious.
    
### Injection 
In theory you can inject anything into almost everything :) Circular dependencies do not exist, because it is not 
possible to inject into a constructor. Keep your constructors empty or as small as possible! 

So, to inject `Foo` into `Bar`
    
    class Bar {}
        
    const descriptor = {
        name: 'bar',
        ref: Bar,
        inject: [{property: 'foo', name: 'foo'}]
    };
    DI.set(descriptor);
        
      
This will assign an instance of `Foo` to the `foo` property of Bar on first usage. 
This is lazy initialization, which can be turn off with the `lazy: false`

     const descriptor = {
        name: 'bar',
        ref: Bar,
        inject: [{property: 'foo', name: 'foo', lazy: false}]
    };

Now, the `bar` instance is created with all it properties injected

    // First create an instance of Bar, then set an instance of Foo; `myApp.foo = foo` 
    const myApp = DI.get('bar'); 
    myApp.foo instanceof Foo; // --> true

**DI-XXL** initializes `bar` as follows

    const bar = new Bar();
    bar.foo = this.get('foo');
       
### ACTIONS
Anything can be registered, like classes, objects, but also normal functions (not constructors).
If a function is not a constructor you need to instruct **DI-XXL** what it should do, return the function or call it first
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
        inject: [{property: 'creator', factory: 'foo'}] // Each entity has a factory!
    }

The factory function, which produces instances of `Foo` is injected into the `creator` property of `bar`

    const bar = DI.get('bar');
    const foo = bar.creator({params: [1,2]}); // new Foo(1,2)
    
Everything registered in **DI-XXL** has by default a factory. For example

    class Bar { /* ... */ }
    DI.set({name: 'xyz', ref: Bar});
    const factory = DI.getFactory('xyz', { params: [1,2]});
    factory({params: [3,4]}) // -> new Bar(3,4)

### Projections
Projections let you map an entity name to an other

    DI.setProjection({'foo': 'bar'}); // Is the same: 

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
It means that **DI-XXL** will look for `list` using the following entity names

    list               --> no
    user.list          --> no
    user.widgets.list  --> yes
    
This allows you to redefine entities without replacing the original

    DI.set({ name: 'user.list', ....});
    
This time the search for `list` looks like

    list       --> no
    user.list  --> yes
    
It will not find `user.widgets.list`. This is the default lookup direction (`DI.DIRECTIONS.PARENT_TO_CHILD`), 
but you can reverse the lookup

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

### Roles 
Each entity can have a role and a `reject` and `accept` list of roles.....
     const descriptor = {
        name: 'service.user',
        ...
        role: 'service'
        accept: ['service'],
        reject: ['component']
     }

If you specify `accept` all injected entities need to have a role present in the list!

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
    
Please note that this will not work out of the box when you're using Typescript. Read about `di-inject` below to work around this issue!

The `@Injectable` statements are directly executed, meaning that they are immediately available

    import {ID} from 'di-xxl';
    
    let bar = DI.get('bar', {params: [100]});
    bar.add(1); // -> 101
    
Checkout the unit tests fixtures [file](https://github.com/scaljeri/di-xxl/blob/master/test/fixtures/decorators.js) for more advanced use cases

### Inject into a constructor
Ok, if you really really really have to do this you can of course do it ... yourself :)

    const params = [DI.get('foo'), 10];
    const bar = DI.get('bar', {params});
    
 
 ### `di` executable to the rescue

Unfortunately you cannot use the @decorators in combination with Typescript 
out of the box. Typescript ignores files which are not used directly, for example

file: `foo.ts`

    @Injectable({name: 'foo'})
    class Foo {
        sum(a, b) { return a + b }
    }

file `index.ts`

    import { DI } from 'di-xxl';

    const foo = DI.get('foo'); // -> foo === undefined

Now, when Typescript compiles `index.ts` it has no notion of `Foo`, so it ignores that file, 
meaning the `@Injectable` is never executed. This can be fixed to use `Foo` inside `index.ts`

    import { DI } from 'di-xxl';
    import { Foo } from './foo';
    Foo;

    const foo = DI.get('foo'); // -> foo === Foo instance

  This exactly what `./node_modules/.bin/di` does

    Options:
      --help         Show help                                                                                               [boolean]
      --version      Show version number                                                                                     [boolean]
      --command, -c  After injecting dependencies, it runs the command. Default argument is `tsc`
      --base, -b     Base path to the root of the source files                                                                [string]
      --debug, -d    Enable debug messages                                                                                   [boolean]
      --entry, -e    Entry filename                                                                                           [string]
      --pattern, -p  Glob patterns specifying filenames with wildcard characters, defaults to **/*.ts                         [string]
      --output, -o   Output file relative to `base. Defaults to `<entryfile>`-di.ts`                                          [string]

    Examples:
      $> di ./src/main.ts                                   -- Run main.ts using ts-node
      $> di -c ./src/main.ts                                -- Compiles the code using `tsc`
      $> di -b ./src -e index.ts -p '**/*.ts' -o out.ts     -- Run the code 
      $> di -b ./src index.ts -- --thread 10                -- Run `ts-node ./src/index-di.ts --thread 10` 
      $> di -c -b ./src -e index.ts -p '**/*.ts' -o out.ts  -- Compiles all code with `tsc`
      $> di -c 'yarn build' -b ./src -e index.ts -o out.ts  -- Injects and runs `yarn build`
      $> di -c yarn -b ./src -e index.ts -o out.ts -- build  -- Same as above


It is a wrapper around `ts-node` (to execute the code)

    $> di ./src/index.ts

or to compile

    $> di -c ./src/index.ts
 
or any tool   

    $> di -c 'yarn build' ./src/index.ts
   
With `--` you can also pass arguments to these processes

    $> di ./src/index.ts -- -theads 10   // -> `ts-node ./src/index-di.ts --threads 10
    
Finally, to pass arguments to the `ts-node` or whatever program you want to use    
a new file with the fix. The output file naming is as follows

    $> di ./src/main.ts           // -> output file: ./src/main-di.ts
    $> di ./src/main.ts -o out.ts // -> output file: ./src/out.ts
    
If no output file (`-o`) is defined, the input filename is used and post-fixed with `-di` 
    
    ./src/index.ts --> ./src/index-di.ts

### More information
A lot more advanced use-cases are available inside the [unit test](https://github.com/scaljeri/javascript-dependency-injection/blob/master/test/di.spec.js) files.

#### Installation ####

Install this library with `yarn` or `npm`

    $> yarn add di-xxl
    
    $> npm install di-xxl
    
#### Commands ####
Convert **DI--XXL** into  an UMD and ES5 library + a minified version in `./dist` 

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
There are a couple of ways to run this library in the browser. If you're project doesn't support
`import` or `require` use `browserify`. For es2015 use [babelify](https://github.com/babel/babelify) 
   
    $> ./node_modules/.bin/browserify index.js -o bundle.js -t [ babelify --presets [ env ] ]
    
  and for es5 you only need to do
  
    $> ./node_modules/.bin/browserify index.js -o bundle.js
    
[DEMO](https://npm.runkit.com/di-xxl)

[coveralls-image]: https://coveralls.io/github/scaljeri/javascript-dependency-injection?branch=master
[coveralls-url]: https://coveralls.io/repos/github/scaljeri/javascript-dependency-injection/badge.svg?branch=master

[depstat-url]: https://david-dm.org/scaljeri/di-xxl
[depstat-image]: https://david-dm.org/scaljeri/di-xxl.svg

[coveralls-image]: https://coveralls.io/repos/github/scaljeri/di-xxl/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/scaljeri/di-xxl?branch=master

