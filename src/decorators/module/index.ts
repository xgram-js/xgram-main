import { Class } from "@/types/class";
import { isControllerClass } from "@/decorators/controller";
import { isProviderClass } from "@/decorators/provider";
import chalk from "chalk";

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
                    `Controller class must be decorated with @Controller() (caused by ${chalk.green(controller.name)} imported from ${chalk.cyan(target.name)})`
                );
        });

        metadata.providers?.forEach(provider => {
            if (!isProviderClass(provider))
                throw new Error(
                    `Provider class must be decorated with @Provider() (caused by ${chalk.yellow(provider.name)} imported from ${chalk.cyan(target.name)})`
                );
        });

        metadata.imports?.forEach(module => {
            if (!isModuleClass(module))
                throw new Error(
                    `Module class must be decorated with @Module() (caused by ${chalk.cyan(module.name)} imported from ${chalk.cyan(target.name)})`
                );
        });
    };
}

export interface ModuleImportTreeNode {
    thisModule: Class;
    children: ModuleImportTreeNode[];
}

export function buildModuleImportTree(module: Class, resolved: Class[] = []): ModuleImportTreeNode {
    if (!isModuleClass(module))
        throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(module.name)})`);
    const metadata = Reflect.getOwnMetadata(MODULE_METADATA, module) as ModuleMetadata;
    const children: ModuleImportTreeNode[] = [];
    if (resolved.includes(module)) throw new Error(`Import loop detected in ${chalk.cyan(module.name)}`);
    (metadata.imports ?? []).forEach(m => {
        children.push(buildModuleImportTree(m, [...resolved, module]));
    });
    return {
        thisModule: module,
        children: children
    };
}

export interface DependencyTreeNode {
    thisModule: Class;
    children: DependencyTreeNode[];
    providersOwn: Class[];
    providersImported: Class[];
    providersInScope: Class[];
    providersExported: Class[];
}

export function buildDependencyTree(
    moduleImportTree: ModuleImportTreeNode,
    resolved: Class[] = []
): DependencyTreeNode {
    const metadata = Reflect.getOwnMetadata(MODULE_METADATA, moduleImportTree.thisModule) as ModuleMetadata;
    const childrenTrees = moduleImportTree.children.map(child => buildDependencyTree(child));
    const providersImported = childrenTrees.map(v => v.providersExported).flat();
    const providersOwn = metadata.providers ?? [];
    const providersInScope = [...providersOwn, ...providersImported];

    (metadata.exports ?? []).forEach(exp => {
        if (!providersInScope.includes(exp))
            throw new Error(
                `Provider ${chalk.yellow(exp.name)} exported from ${chalk.cyan(moduleImportTree.thisModule.name)} is not available in that scope`
            );
    });

    return {
        thisModule: moduleImportTree.thisModule,
        children: childrenTrees,
        providersInScope: providersInScope,
        providersOwn: providersOwn,
        providersImported: providersImported,
        providersExported: metadata.exports ?? []
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
