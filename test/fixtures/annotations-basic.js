import {Injectable, DI_TYPES} from '../../di';

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
    type: DI_TYPES.INJECT
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

