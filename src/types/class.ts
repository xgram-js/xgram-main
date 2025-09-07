export type Class = { new (...args: any[]): any };

export function getClassMethodsNames(cls: Class): string[] {
    const proto = cls.prototype;
    return Object.getOwnPropertyNames(proto).filter(v => v !== "constructor" && typeof proto[v] === "function");
}

export function getClassMethods(cls: Class): ((...args: any[]) => any)[] {
    const names = getClassMethodsNames(cls);
    const proto = cls.prototype;
    return names.map(v => proto[v]);
}
