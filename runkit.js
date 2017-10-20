var di = require('di-xxl');
var DI = di.DI;

function Foo(base) {
    return {
        multiplyBy: function(val) { return base * val; }
    }
}

DI.set({
    name: 'foo',
    ref: Foo,
    action: DI.ACTIONS.INVOKE,
    params: [2]
});

console.log(DI.get('foo').multiplyBy(3));
console.log(DI.get('foo', {params: [10]}).multiplyBy(3));
