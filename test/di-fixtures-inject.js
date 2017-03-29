export class BarSimple {
    constructor() {}
}

export class BarBasic {
    constructor(a, b, c) {
        this.args = arguments;
        this.inject = ['$foo', '$barSimple'];
    }
}

export class BarComplex {
    constructor(a, $foo, c, $barBasic, d) {
        this.args = arguments;
        this.inject = ['$foo', '$barSimple'];
    }
}

export function Foo(a, $foo, $barComplex, b, c) {
    this.args = arguments;
    this.inject = ['$barSimple'];
}

