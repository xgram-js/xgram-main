export type Class = { new (...args: any[]): any };
export type InstanceOf<C extends Class = Class> = C extends { new (...args: any[]): infer R } ? R : never;

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
