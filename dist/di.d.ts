export interface DIInject {
    property: string;
    name: string;
}
export interface DIDescriptor {
    name: string;
    ref: any;
    ns?: string;
    inherit?: string;
    params?: any[];
    inject?: DIInject[];
    action?: any;
    singleton?: boolean;
}
export declare function Injectable(descriptor: DIDescriptor): (ref: any) => void;
export declare function Inject(config: Partial<DIInject>): (ref: any, property: any, settings: any) => any;
export declare class DI {
    static readonly DIRECTIONS: {
        CHILD_TO_PARENT: number;
        PARENT_TO_CHILD: number;
    };
    static defaults: any;
    static readonly ACTIONS: {
        CREATE: number;
        INVOKE: number;
        NONE: number;
    };
    static getDescriptor(name: string, ns?: string, descriptor?: Map<any, any>): any;
    static lookupDescriptor(name: string, config?: {}): any;
    static getFactory(name: any, config?: {
        params: any[];
    }): (...params: any[]) => any;
    static getProjection(name: string, ns?: string, projections?: Map<any, any>): any;
    static get(name: string, config?: any): any;
    static setProjection(list: any, projections?: Map<any, any>): typeof DI;
    static removeProjection(key: string, projections?: Map<any, any>): typeof DI;
    static removeDescriptor(name: string, ns?: string, descriptors?: Map<any, any>): typeof DI;
    static set(descriptor: DIDescriptor): typeof DI;
    private defaults;
    private projections;
    private descriptors;
    constructor(descriptor?: {});
    getDescriptor(name: string, ns?: string): any;
    lookupDescriptor(name: string, config?: any): any;
    getProjection(name: string, ns?: string): any;
    setProjection(list: any): this;
    removeProjection(key: string): this;
    removeDescriptor(name: string): this;
    get(name: string, config?: any): any;
    set(descriptor: DIDescriptor): any;
    getFactory(name: string, config: any): (...params: any[]) => any;
}
