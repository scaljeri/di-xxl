import {DI} from './di';

const di = new DI();

console.log(di);
class Foo {
    constructor() { this.args = arguments}
}

class Bar {
    constructor($foo) { this.args = arguments}
}

di.register('$foo', Foo, {singleton: true});
di.register('$bar', Bar, {inject: DI.ACTIONS.CONSTRUCTOR});
di.register('$baz', Bar);

let bar = di.getInstance('$bar', 100);
let foo = di.getInstance('$foo');

window.Foo = Foo;
window.Bar = Bar;
window.DI = DI;
window.di = di;
console.log('READY');