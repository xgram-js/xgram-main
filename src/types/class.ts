export type Class<R = any> = { new (...args: any[]): R };
export type AbstractClass<R = any> = abstract new (...args: any[]) => R;
export type AnyClass = Class | AbstractClass;
export type InstanceOf<C extends Class = Class> = C extends Class<infer R> ? R : never;
export type InstanceOfAbstract<C extends AbstractClass> = C extends AbstractClass<infer R> ? R : never;
export type ExtendedAbstractClass<C extends AbstractClass> = Class<InstanceOfAbstract<C>>;

export function getClassOfInstance(instance: InstanceOf) {
    return instance.constructor as Class;
}

export function getClassMethodsNames(cls: Class): string[] {
    const proto = cls.prototype;
    return Object.getOwnPropertyNames(proto).filter(v => v !== "constructor" && typeof proto[v] === "function");
}

export function getClassMethods(cls: Class): ((...args: any[]) => any)[] {
    const names = getClassMethodsNames(cls);
    const proto = cls.prototype;
    return names.map(v => proto[v]);
}
