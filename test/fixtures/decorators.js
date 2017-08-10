import {Injectable, Inject} from '../../di';

@Injectable({
    name: 'decorator.$foo'
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
    inherit: 'decorator.$foo'
})
export class Bar extends Foo {}

@Injectable('decorator.mode')
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

@Injectable({
    ns: 'decorator'
})
export class Mooz {
    @Inject('decorator.Maz')
    setService(service) {
        this.service = service
    }
}

@Injectable({
    ns: 'decorator'
})
export class Wooz {
    @Inject({ factory: true, name: 'decorator.Mooz'})
    setFactory(factory) {
        this.factory = factory
    }
}

@Injectable({
    ns: 'decorator',
    inherit: 'decorator.Wooz'
})
export class Buzu extends Wooz {}
