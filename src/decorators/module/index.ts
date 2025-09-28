import { Class } from "@xgram/types";
import { CONTROLLER_MODULE_DEFINITOR, isControllerClass } from "@/decorators/controller";
import { isProviderClass } from "@/decorators/provider";
import chalk from "chalk";

export interface ModuleMetadata {
    imports?: Class[];
    exports?: Class[];
    controllers?: Class[];
    providers?: Class[];
}

export const MODULE_METADATA = Symbol("module:metadata");

export default function Module(metadata: ModuleMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(MODULE_METADATA, metadata, target);

        metadata.controllers?.forEach(controller => {
            if (!isControllerClass(controller))
                throw new Error(
                    `Controller class must be decorated with @Controller() (caused by ${chalk.green(controller.name)} imported from ${chalk.cyan(target.name)})`
                );
            if (Reflect.hasOwnMetadata(CONTROLLER_MODULE_DEFINITOR, controller))
                throw new Error(
                    `Controller ${chalk.green(controller.name)} defined multiply times:
                    (${chalk.cyan(target.name)},
                    ${chalk.cyan((Reflect.getOwnMetadata(CONTROLLER_MODULE_DEFINITOR, controller) as Class).name)})`
                );
            else Reflect.defineMetadata(CONTROLLER_MODULE_DEFINITOR, target, controller);
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
    controllers: Class[];
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
    const controllers = metadata.controllers ?? [];

    (metadata.exports ?? []).forEach(exp => {
        if (!providersInScope.includes(exp))
            throw new Error(
                `Provider ${chalk.yellow(exp.name)} exported from ${chalk.cyan(moduleImportTree.thisModule.name)} is not available in that scope`
            );
    });

    const detectLoop = (provider: Class, resolved: Class[]) => {
        if (resolved.includes(provider)) {
            const chain = [...resolved, provider].map(p => chalk.yellow(p.name)).join(" -> ");
            throw new Error(`Detected dependency loop: ${chain}`);
        }

        const deps = (Reflect.getOwnMetadata("design:paramtypes", provider) ?? []) as Class[];
        deps.forEach(dep => detectLoop(dep, [...resolved, provider]));
    };

    providersOwn.forEach(p => detectLoop(p, resolved));

    return {
        thisModule: moduleImportTree.thisModule,
        children: childrenTrees,
        providersInScope: providersInScope,
        providersOwn: providersOwn,
        providersImported: providersImported,
        providersExported: metadata.exports ?? [],
        controllers: controllers
    };
}

export function isModuleClass(module: Class) {
    return Reflect.hasOwnMetadata(MODULE_METADATA, module);
}
