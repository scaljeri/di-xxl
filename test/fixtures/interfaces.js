import {Injectable, Inject} from '../../di';

@Injectable({
    ns: 'decorator',
    name: '$foo',
    params: ['maz']
})
export class Foo {
    @Inject('iService')
    service;

    // new Foo({$model: modelInstance});
    constructor() {
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

@Injectable()
export class Maz {
    constructor() { this.args = arguments; }
}
