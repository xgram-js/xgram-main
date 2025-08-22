import {Class} from "@/types/class";

export interface ModuleMetadata {
    imports?: Class[];
    exports?: Class[];
    providers?: Class[];
}

export default function Module(metadata: ModuleMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata("module:metadata", metadata, target);
    };
}

export function isModuleClass(module: Class) {
    return Reflect.hasOwnMetadata("module:metadata", module)
}
