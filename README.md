[![CircleCI](https://circleci.com/gh/scaljeri/di-xxl/tree/master.svg?style=svg)](https://circleci.com/gh/scaljeri/di-xxl/tree/master) [![Inline docs](http://inch-ci.org/github/scaljeri/di-xxl.svg?branch=master)](http://inch-ci.org/github/scaljeri/di-xxl) [![Coverage Status](https://coveralls.io/repos/github/scaljeri/di-xxl/badge.svg?branch=master)](https://coveralls.io/github/scaljeri/di-xxl?branch=master) 

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library 

**DI-XXL** is a dependency injection library facilitating lazy initialization and loose coupling. 
It is generic, because it can inject everything into anything in multiple ways. Together with support 
for namespaces, decorators, factory functions, projections and lazy initialization it is a powerful 
tool ready for complex situations.

In its most basic form a registration of an entity like a class, object or function is done as follows

    import {DI} from 'di-xxl';
    
    class Foo {
        doMagic() { ... }
    }
    
    const descriptor = {
        name: 'foo',
        ref: Foo
    };
    
    DI.set(descriptor)
    
Class `Foo` is registered here and is now accessible by the name `foo`. The `descriptor` object needs at least 
a `name` and a `ref`erence. Use `get` to retrieve an instance of `Foo` 

    const foo = DI.get('foo'); // This is equivalent to: `const foo = new Foo()`

NOTE (Because I've made this mistake many times:) **Don't use DI inside the body of the constructor!!!!**

    class Bar {
         @Inject('foo') foo;

         constructor() {
             this.foo.doMagic(); // --> Error, this.foo is undefined
         }
    }

Dependencies are injected after the Bar instances is created (Below you can find more about @decorators)
    
### Parameters
The example above shows the creation of an instance without parameters, but you can provide constructor arguments
    
    const descriptor = {
        name 'foo', 
        ref: Foo,
        params: [10, 20] // -> constructor arguments
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
        
This will assign an instance of `Foo` to the `foo` property of Bar. Lazy initialization
is used here, meaning that Foo will be created when it is used for the first time. To disable this 
feature set the `lazy` option to `false` 

     const descriptor = {
        name: 'bar',
        ref: Bar,
        inject: [{property: 'foo', name: 'foo', lazy: false}]
    };

### ACTIONS
Anything can be registered, like classes, objects, but also normal functions.
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
To turn a class into a singleton add the singleton flag to the descriptor

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
For each registered entity **DI-XXL** creates a factory; a produces of instances (or whatever
the action type is) from that entity. In the following example, the factory function creates 
instances of Bar

    class Bar { /* ... */ }
    DI.set({name: 'xyz', ref: Bar});
    const factory = DI.getFactory('xyz', { params: [1,2]});
    let bar = factory()            // -> new Bar(1,2)
    bar = factory({params: [3,4]}) // -> new Bar(3,4)

Factories can also be injected

    descriptor = {
        name: 'bar',
        ref: Bar,
        inject: [{property: 'creator', factory: 'foo'}]
    }

This produces `Bar` instances with a `Foo` factory

    const bar = DI.get('bar');
    const foo = bar.creator({params: [1,2]}); // new Foo(1,2)

### Projections
Projections let you map an entity name to another name. For example

    DI.setProjection({'foo': 'bar'});

    const something = DI.get('foo');  // same as `DI.get('bar')
    
results in `something instanceof Bar`. Projections can be used, for example, to change the behaviour of you application dynamically, based on user action.

### Namespaces
Namespaces help to structure your entities in a descriptive way. A namespace is a prefix of the entity name

    user.overview.profile
    
with `user.overview` being the namespace. Try to keep your entity names unique within the whole namespace. For example

    user.profile
    user.overview.profile
    
`profile` is not unique!! As long as you know what your are doing this isn't a problem. The reason behind this is how namespaces are implemented, for example
 
    class User { ... }
    
    DI.set({ 
        name: 'user.overview.profile', 
        ref: User,
        inject: [
            {property: 'list', name: 'user.widgets.list'},
            {property: 'source', name: 'user.data.source'}]});
        
    DI.get('user.overview.profile');
  
The `list` and `source` entities, although exactly specified, will be searched for within the namespace from the root up. It means that **DI-XXL** will look for `list` using the following entity names

    list               --> no
    user.list          --> no
    user.widgets.list  --> yes
    
This allows you to redefine entities without replacing the original. If we would define a list as `user.list`

    DI.set({ name: 'user.list', ....});
    
the above `list` search is now as follows

    list       --> no
    user.list  --> yes
    
It will not find `user.widgets.list`. This is the default lookup direction (`DI.DIRECTIONS.PARENT_TO_CHILD`), but you can reverse the lookup

    DI.get('user.overview.profile', {lookup: DI.DIRECTIONS.CHILD_TO_PARENT});
    
So far we have only talked about the entities from the `inject` list, but this search pattern is also applied on the entity request, with one exception, the first attempt is always the exact name provided

    // DI.DIRECTIONS.CHILD_TO_PARENT
       user.overview.profile
       user.profile
       profile
       
    // DI.DIRECTIONS.PARENT_TO_CHILD (DEFAULT!)
       user.overview.profile
       profile
       user.profile

### Roles 
Each entity can have one `role` and list of `reject` and `accept` roles

     const descriptor = {
        name: 'service.user',
        ...
        role: 'service'
        accept: ['service'],
        reject: ['component']
     }

If you specify `accept` all injected entities need to have a role present in the list. But if you define `reject` everything can be injected except for the roles defined in the reject list.

### @Decorators    
As of this writing you have to use a couple of babel plugins to get `@decorators` up and running, or if you're using typescript make sure to set the `experimentalDecorators` option to true in `tsconfig.json`. 
With Decorators you can define all dependency related configuration inside the class itself 

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

The `@Inject` also accepts an object instead of just the name/string

    @Inject({ name: 'foo', lazy: false }) addService;
    
**Please note that this might not work out of the box when you're using Typescript. Read about `di executable to the rescue` below to work around this issue!**

The `@Injectable` statements are directly executed, meaning that they are immediately available

    import {ID} from 'di-xxl'; // `bar` is already available!
    
    let bar = DI.get('bar', {params: [100]});
    bar.add(1); // -> 101
    
Checkout the unit tests fixtures [file](https://github.com/scaljeri/di-xxl/blob/master/test/fixtures/decorators.js) for more advanced use cases

### Inject into a constructor
Ok, if you really really really have to do this you can of course do it ... yourself :)

    const params = [DI.get('foo'), 10];
    const bar = DI.get('bar', {params}); // same as: `new Bar(fooInstance, 10)`
 
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
meaning the `@Injectable` is never executed. This can be fixed by using `Foo` inside `index.ts`

    import { DI } from 'di-xxl';
    import { Foo } from './foo';
    Foo;

    const foo = DI.get('foo'); // -> foo === Foo instance

This is exactly what `./node_modules/.bin/di` does

      $> di ./src/index.ts

What this does, it creates a file called `./src/index-id.ts` with all the files using `@Injectable` injected

    import { DI } from 'di-xxl';
    import { Foo } from './foo';Foo;

    const foo = DI.get('foo'); // -> foo === Foo instance

But it will also behave like `ts-node`, because after it has created `index-id.ts` it will run

    ts-node ./src/index-di.ts

But if only compiling is what you need and not running the code with `ts-node` you can 

    $> di -c tsc ./src/index.ts

And if you need, for example, to specifiy a custom config file for `tsc` do

    $> di -c tsc ./src/index.ts -- -p my-special-tsconfig.json

Everything after the `--` will be used as arguments for the command you specifiy with `-c`.
Below is a listing of options to further tune the behavior of this tool:

    Options:
      --help         Show help                                                                                               [boolean]
      --version      Show version number                                                                                     [boolean]
      --command, -c  After injecting dependencies, it runs the command. Default argument is is `ts-node`
      --base, -b     Base path to the root of the source files                                                                [string]
      --debug, -d    Enable debug messages                                                                                    [boolean]
      --entry, -e    Entry filename                                                                                           [string]
      --include, -i  List of paths/files to include                                                                           [string]
      --pattern, -p  Glob patterns specifying filenames with wildcard characters, defaults to **/*.ts                         [string]
      --output, -o   Output file relative to `base. Defaults to `<entryfile>`-di.ts`                                          [string]

    Examples:
      $> di ./src/main.ts                                   -- Run main.ts using ts-node
      $> di -c ./src/main.ts                                -- This runs the code using `ts-node`
      $> di -b ./src -e index.ts -p '**/*.ts' -o out.ts     -- Run the code 
      $> di -b ./src index.ts -- --thread 10                -- Run `ts-node ./src/index-di.ts --thread 10` 
      $> di -c -b ./src -e index.ts -p '**/*.ts' -o out.ts  -- Compiles all code with `tsc`
      $> di -c 'yarn build' -b ./src -e index.ts -o out.ts  -- Injects and runs `yarn build`
      $> di -c yarn -b ./src -e index.ts -o out.ts -- build  -- Same as above

Here is a more complex example

      $> di -d -c tsc -b ./src -i 'frontend,shared' -e 'Foo,Bar' frontend/main.ts -- -p tsconfig-frontend.json

It might be useful to add the file created by `di` to your `.gitignore` file!

### More information
A lot more advanced use-cases are available inside the [unit test](https://github.com/scaljeri/javascript-dependency-injection/blob/master/test/di.spec.js) files.

#### Installation ####

Install this library with `yarn` or `npm`

    $> yarn add di-xxl

or
    
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
    
### Run in the browser
There are a couple of ways to run this library in the browser. If your project doesn't support
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

## TODO
  * Support multiple roles
```
    const descriptor = {
     name: 'service.user',
           ...
           role: ['service', 'component', 'admin'],
           accept: ['service'],
           reject: ['component']
        }
```
Above the value of `role` is an array of roles. For backwards compatibility the original `string` version should be supported too!

  * Fix CircleCI. 
    