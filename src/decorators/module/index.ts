import { Class } from "@/types/class";
import { isControllerClass } from "@/decorators/controller";
import { isProviderClass } from "@/decorators/provider";

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

        metadata.providers?.forEach(provider => {
            if (!isProviderClass(provider))
                throw new Error(
                    `Provider class must be decorated with @Provider() (caused by ${provider.name} imported from ${target.name})`
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

export function getAvailableProvidersInModuleScope(
    metadata: ModuleMetadata,
    options?: { ignoreExports?: boolean }
): Class[] {
    const self = metadata.providers ?? [];
    const fromImported = (metadata.imports ?? [])
        .map(m => {
            const mMetadata = Reflect.getOwnMetadata(MODULE_METADATA, m) as ModuleMetadata;
            const available = getAvailableProvidersInModuleScope(mMetadata);
            const exported = mMetadata.exports ?? [];
            let result = new Set<Class>([...available]);
            for (const exp of exported) {
                if (!available.includes(exp))
                    throw new Error(`Module ${exp.name} exported from ${m.name} is not available in that scope`);
                result.add(exp);
            }
            return result.values().toArray();
        })
        .flat();
    return [...self, ...fromImported];
}

export function isModuleClass(module: Class) {
    return Reflect.hasOwnMetadata(MODULE_METADATA, module);
}
