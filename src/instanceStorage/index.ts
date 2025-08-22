import { Class } from "@/types/class";
import { getAvailableProvidersInModuleScope, isModuleClass, MODULE_METADATA } from "@/decorators/module";

export class InstanceStorage {
    instances: Map<Class, any> = new Map();
    private resolving = new Set<Class>();

    public getInstance(of: Class) {
        if (this.instances.has(of)) return this.instances.get(of);
        if (this.resolving.has(of))
            throw new Error(
                `Dependency loop detected in ${of.name} (${this.resolving
                    .values()
                    .map(v => v.name)
                    .toArray()
                    .join(" ")})`
            );

        this.resolving.add(of);
        const dependencies = Reflect.getMetadata("design:paramtypes", of) ?? [];
        const resolvedDependencies = dependencies.map((dep: Class) => this.getInstance(dep));

        const instance = new of(...resolvedDependencies);
        this.instances.set(of, instance);
        this.resolving.delete(of);
        return instance;
    }

    public resolveForModule(module: Class) {
        if (!isModuleClass(module))
            throw new Error(`Module class must be decorated with @Module() (caused by ${module.name})`);
        const providers = getAvailableProvidersInModuleScope(Reflect.getOwnMetadata(MODULE_METADATA, module), {
            ignoreExports: true
        });
        providers.forEach((provider: Class) => this.getInstance(provider));
    }
}
