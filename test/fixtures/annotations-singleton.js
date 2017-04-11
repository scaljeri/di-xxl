import {Injectable, DI} from '../../di';

@Injectable({
    ns: 'singleton',
    singleton: true
})
export class Foo {

}

@Injectable({
    name: 'singleton.$bar',
    singleton: true
})
export class Bar {

}

@Injectable({
    ns: 'singleton',
    name: '$bar',
    singleton: true,
    inject: DI.ACTIONS.CONSTRCUTOR
})
export class Baz {
    constructor(foo) {
        this.fooo = foo;
    }
}