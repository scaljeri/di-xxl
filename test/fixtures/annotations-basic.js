import {Injectable, DI} from '../../di';

@Injectable()
export class Foo {
    constructor(value) {
        this.value = value;
    }
}

@Injectable('$bar')
export class Bar {
    constructor(value) {
        this.value = value;
    }
}

@Injectable({
    inject: DI.ACTIONS.CONSTRUCTOR
})
export class Baz {
    constructor(foo) {
        this.fooo = foo;
    }
}

@Injectable({
    params: ['baz']
})
export class Qux {
    constructor(value) {
        this.value = value;
    }
}

