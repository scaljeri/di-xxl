import {Injectable, Inject} from '../../di';

@Injectable({
    ns: 'decorator',
    name: '$foo'
})
export class Foo {
    @Inject('decorator.iService')
    service;

    constructor() {
        this.args = arguments;
    }
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
    singleton: true,
    role: 'x'
})
export class Maz {
    constructor() { this.args = arguments; }
}

@Injectable({ns: 'decorator'})
export class BooArgs {
    // new Foo({$model: modelInstance});
    constructor({val1, val2}) {
        this.val1 = val1;
        this.val2 = val2;
    }
}
