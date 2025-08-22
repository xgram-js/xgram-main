import { Class } from "@/types/class";
import { isControllerClass } from "@/decorators/controller";

export interface ModuleMetadata {
    imports?: Class[];
    exports?: Class[];
    controller?: Class[];
    providers?: Class[];
}

export const MODULE_METADATA = Symbol("module:metadata");

export default function Module(metadata: ModuleMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(MODULE_METADATA, metadata, target);

        metadata.controller?.forEach(controller => {
            if (!isControllerClass(controller))
                throw new Error(
                    `Controller class must be decorated with @Controller() (caused by ${controller.name} imported from ${target.name})`
                );
        });

        metadata.imports?.forEach(module => {
            if (!isModuleClass(module))
                throw new Error(
                    `Module class must be decorated with @Module() (caused by ${module.name} imported from ${target.name})`
                );
        });
    };
}

export function isModuleClass(module: Class) {
    return Reflect.hasOwnMetadata(MODULE_METADATA, module);
}
