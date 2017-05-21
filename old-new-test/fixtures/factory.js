export class Foo {
    constructor() {
        this.args = arguments;
    }
}

export function someFactory(...params) {
    return new Foo('custom', ...params);
}
