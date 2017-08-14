import {DI} from './di';

class Foo {
    constructor() { this.args = arguments}
}

class Bar {
    constructor($foo) { this.args = arguments}
}

DI.set({ name: 'foo', ref: Foo, singleton: true});
DI.set({ name: 'bar', ref: Bar, inject: [{property: 'foo', factory: true, name: 'foo'}]});
DI.set({ name: 'baz', ref: Bar});

let bar = DI.get('bar', {params: [100]});
let foo = DI.get('foo');

window.Foo = Foo;
window.Bar = Bar;
window.bar = bar;
window.foo = foo;
window.DI = DI;
console.log('READY');