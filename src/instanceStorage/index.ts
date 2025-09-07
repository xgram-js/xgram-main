import { Class } from "@/types/class";
import { DependencyTreeNode, isModuleClass } from "@/decorators/module";
import chalk from "chalk";
import { isProviderClass } from "@/decorators/provider";
import { LoggerLike } from "@/logger";

export class InstanceStorage {
    constructor(private readonly logger: LoggerLike) {}

    instances: Map<Class, Map<Class, any>> = new Map();

    public getInstance(of: Class, dependencyTree: DependencyTreeNode, resolved: Class[] = []): any {
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
            if (!res) throw new Error(`Provider ${of.name} is not available in scope ${scope.name}`);
            providerDefinitorModule = res;
        }

        this.logger.log(
            "InstanceStorage",
            `Getting instance of ${chalk.yellow(of.name)} from module ${chalk.cyan(scope.name)}. Definitor: ${chalk.cyan(providerDefinitorModule.thisModule.name)}`
        );

        const deps: Class[] = Reflect.getOwnMetadata("design:paramtypes", of) ?? [];
        const resolvedDeps = deps.map(dep => this.getInstance(dep, dependencyTree, resolved));

        const instance = new of(...resolvedDeps);

        if (!this.instances.has(providerDefinitorModule.thisModule))
            this.instances.set(providerDefinitorModule.thisModule, new Map());
        this.instances.get(providerDefinitorModule.thisModule)!.set(of, instance);

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
        dependencyTree.providersInScope.forEach(provider => this.getInstance(provider, dependencyTree));
        dependencyTree.children.forEach(child => this.resolveForModule(child.thisModule, child));
    }
}
