import {DI} from '../src/di';
import * as fixtures from '../test/fixtures/decorators';

console.log(DI);
compare("Classes vs Objects", () => {
    DI.set({ name: 'bencha.obj', ref: {}});

    benchmark('Class', () => {
        DI.get('decorator.basic');
    });

    benchmark('Object', () => {
        DI.get('bencha.basic');
    });
});

/*
compare("RegExp vs String::indexOf", () => {
    const input = "demo.string";

    benchmark("RegExp", function(){
        /(\.)/.test(input);
    });
    benchmark("String::indexOf", function(){
        input.indexOf(".") > -1;
    });
});

suite("My Feature", function(){
    benchmark("foo() no arguments", function(){
        foo();
    });
    benchmark("foo() with arguments", function(){
        foo(true, false);
    });
    benchmark("bar()", function(){
        bar()
    });
});
*/