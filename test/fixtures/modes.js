import {Injectable} from '../../di';

@Injectable({
    ns: 'a.b.c',
    name: '$xFoo',
})
export class CFoo {}

@Injectable({
    ns: 'a',
    name: '$xfoo'
})
export class BFoo {}

@Injectable({
    name: '$xfoo',
    ns: ''
})
export class AFoo {}

@Injectable({
    ns: 'a.b',
    name: '$yFoo'
})
export class EFoo {}
