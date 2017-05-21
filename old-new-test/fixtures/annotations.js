import {Injectable, Inject} from '../../di';

@Injectable('test.$bar', {singleton: true})
export class Bar {
    constructor() {

    }
}

@Injectable('test.$baz', {writable: true})
@Inject('test:$bar')
export class Baz {
    constructor($foo) {

    }
}

@Injectable('$foo', {injectInto: INJECTABLE_TYPES.INSTANCE})
@Inject('test.$bar', 'test.$baz')
export class Foo {
    constructor(value) {
    }
}

@Injectable('$foo', {params: [10, 20]})
export class Foo {
    constructor(value) {
        this.value = value;
    }
}
