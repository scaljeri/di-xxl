import {DI} from '../dist/di';
import * as fixtures from '../test/fixtures/decorators';

compare("Classes vs Objects", () => {
    DI.set({ name: 'bencha.obj', ref: {}});

    benchmark('Class', () => {
        DI.get('decorator.basic');
    });

    benchmark('Object', () => {
        DI.get('bencha.basic');
    });
});

suite("DI Feature", function(){
    let di = new DI();
    di.set({ name: 'a.b.c.d.foo', ref: fixtures.Foo});

    benchmark("Register", () => {
        di.set({name: 'x.y.z.foo', ref: Foo});
    });

    benchmark("Class", () => {
        di.get('a.b.c.d.foo');
    });

    benchmark("Object", () => {
        di.get('bencha.basic');
    });

    benchmark("Namespace traversal", () => {
        di.get('a.b.c.d.e.foo');
    });
});
