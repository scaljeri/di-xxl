compare("RegExp vs String::indexOf", function(){
    var input = "demo.string"
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