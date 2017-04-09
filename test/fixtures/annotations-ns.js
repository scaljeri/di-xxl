import {Injectable} from '../../di';

@Injectable('ns.$bar')
export class Bar {

}

@Injectable({
    ns: 'ns',
})
export class Foo {}

@Injectable({
    ns: 'ns',
    params: ['foo', 'ns.$bar']
})
export class Baz {}