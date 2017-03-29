import {Injectable, Inject} from '../../di';

@Injectable('$bar', 'global')
@Inject('$foo')
export class Bar {
    constructor( $foo) {

    }
}

@Injectable('$foo')
@Inject('$bar')
export class Foo {
    constructor($bar, $foo) {

    }
}