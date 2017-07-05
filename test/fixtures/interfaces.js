import {Injectable, Inject} from '../../di';

@Injectable({
    ns: 'decorator',
    name: '$foo'
})
export class Foo {
    @Inject('decorator.iService')
    service;

    // new Foo({$model: modelInstance});
    constructor() {
        this.args = arguments;
    }
    /*constructor(model) {
        this.model = $model;
    } */
}

@Injectable({
    ns: 'decorator',
    inherit: '$foo'
})
export class Bar extends Foo {}

@Injectable({
    name: 'mode',
    ns: 'decorator'
})
export class Baz extends Foo {}

@Injectable({
    ns: 'decorator',
    singleton: true
})
export class Maz {
    constructor() { this.args = arguments; }
}
