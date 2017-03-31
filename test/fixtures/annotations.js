import {Injectable, Inject} from '../../di';

@Injectable('test:$bar', {singleton: true})
@Inject('test:$baz')
export class Bar {
    constructor( $foo) {

    }
}

@Injectable('test:$baz', {writable: true})
@Inject('test:$bar')
export class Baz {
    constructor( $foo) {

    }
}

@Injectable('$foo')
@Inject('test:$bar', 'test:$baz')
export class Foo {
    constructor(value) {
    }
}
