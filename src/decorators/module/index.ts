export interface ModuleMetadata {
    imports?: any[];
    exports?: any[];
    providers?: any[];
}

export default function Module(metadata: ModuleMetadata) {
    return (target: any) => {
        Reflect.defineMetadata("module:metadata", metadata, target);
    };
}

export function isModuleClass(module: { new (...args: any[]): any }) {
    return Reflect.hasOwnMetadata("module:metadata", module)
}
