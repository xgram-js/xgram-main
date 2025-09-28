import { Class } from "@xgram/types";
import { DependencyTreeNode, isModuleClass } from "@/decorators/module";
import chalk from "chalk";
import { isProviderClass } from "@/decorators/provider";
import { LoggerLike } from "@/logger";
import { isControllerClass } from "@/decorators/controller";

export class InstanceStorage {
    public constructor(private readonly logger: LoggerLike) {}

    private instances: Map<Class, Map<Class, any>> = new Map();

    // TODO: merge getProviderInstance and getControllerInstance into one method or optimise getControllerInstance
    public getProviderInstance(of: Class, dependencyTree: DependencyTreeNode, resolved: Class[] = []): any {
        const scope = dependencyTree.thisModule;
        if (!isModuleClass(scope))
            throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(scope.name)})`);
        if (!isProviderClass(of))
            throw new Error(
                `Provider class must be decorated with @Provider() (caused by ${chalk.yellow(of.name)} imported from ${chalk.cyan(scope.name)})`
            );

        const moduleScope: Map<Class, any> = this.instances.get(scope) ?? new Map();
        if (moduleScope.has(of)) {
            return moduleScope.get(of);
        }

        if (resolved.includes(of)) {
            const chain = [...resolved, of].map(p => chalk.yellow(p.name)).join(" -> ");
            throw new Error(`Detected dependency loop: ${chain}`);
        }
        resolved.push(of);

        let providerDefinitorModule: DependencyTreeNode;

        if (dependencyTree.providersOwn.includes(of)) {
            providerDefinitorModule = dependencyTree;
        } else {
            const findInChildren = (node: DependencyTreeNode): DependencyTreeNode | null => {
                for (const child of node.children) {
                    if (child.providersOwn.includes(of)) return child;
                    const found = findInChildren(child);
                    if (found) return found;
                }
                return null;
            };
            const res = findInChildren(dependencyTree);
            if (!res) throw new Error(`Provider ${of.name} is not available in scope of ${scope.name}`);
            providerDefinitorModule = res;
        }

        if (this.instances.has(providerDefinitorModule.thisModule)) {
            if (this.instances.get(providerDefinitorModule.thisModule)!.has(of))
                return this.instances.get(providerDefinitorModule.thisModule)!.get(of)!;
        }

        const deps: Class[] = Reflect.getOwnMetadata("design:paramtypes", of) ?? [];
        const resolvedDeps = deps.map(dep => this.getProviderInstance(dep, dependencyTree, resolved));

        const instance = new of(...resolvedDeps);
        this.logger.log(
            "InstanceStorage",
            `Initialised ${chalk.yellow(of.name)}. Definitor: ${chalk.cyan(providerDefinitorModule.thisModule.name)}`
        );

        if (!this.instances.has(providerDefinitorModule.thisModule))
            this.instances.set(providerDefinitorModule.thisModule, new Map());
        this.instances.get(providerDefinitorModule.thisModule)!.set(of, instance);

        if (!this.instances.has(scope)) this.instances.set(scope, new Map());
        this.instances.get(scope)!.set(of, instance);

        return instance;
    }

    public getControllerInstance(of: Class, dependencyTree: DependencyTreeNode, resolved: Class[] = []): any {
        const scope = dependencyTree.thisModule;
        if (!isModuleClass(scope))
            throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(scope.name)})`);
        if (!isControllerClass(of))
            throw new Error(
                `Controller class must be decorated with @Controller() (caused by ${chalk.green(of.name)} imported from ${chalk.cyan(scope.name)})`
            );

        const moduleScope: Map<Class, any> = this.instances.get(scope) ?? new Map();
        if (moduleScope.has(of)) {
            return moduleScope.get(of);
        }

        if (resolved.includes(of)) {
            const chain = [...resolved, of].map(p => chalk.yellow(p.name)).join(" -> ");
            throw new Error(`Detected dependency loop: ${chain}`);
        }
        resolved.push(of);

        const deps: Class[] = Reflect.getOwnMetadata("design:paramtypes", of) ?? [];
        const resolvedDeps = deps.map(dep => this.getProviderInstance(dep, dependencyTree, resolved));

        const instance = new of(...resolvedDeps);
        this.logger.log("InstanceStorage", `Initialised ${chalk.green(of.name)}. Definitor: ${chalk.cyan(scope.name)}`);

        if (!this.instances.has(scope)) this.instances.set(scope, new Map());
        this.instances.get(scope)!.set(of, instance);

        return instance;
    }

    public resolveForModule(module: Class, dependencyTree: DependencyTreeNode) {
        if (!isModuleClass(module))
            throw new Error(`Module class must be decorated with @Module() (caused by ${module.name})`);
        if (dependencyTree.thisModule !== module)
            throw new Error(
                `resolveForModule() argument dependencyTree has unexpected root node (expected ${chalk.cyan(module.name)}, found ${chalk.cyan(dependencyTree.thisModule.name)})`
            );
        dependencyTree.providersInScope.forEach(provider => this.getProviderInstance(provider, dependencyTree));
        dependencyTree.controllers.forEach(controller => this.getControllerInstance(controller, dependencyTree));
        dependencyTree.children.forEach(child => this.resolveForModule(child.thisModule, child));
    }
}
