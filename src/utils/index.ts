import { DependencyTreeNode, ModuleImportTreeNode } from "@/decorators/module";
import archy from "archy";
import chalk from "chalk";
import { Class } from "@/types/class";

export function moduleImportTreeToString(tree: ModuleImportTreeNode): string {
    const fn = (tree: ModuleImportTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: tree.children.map(fn)
        };
    };
    return archy(fn(tree));
}

export function dependenciesToString(provider: Class): archy.Data {
    const deps = Reflect.getOwnMetadata("design:paramtypes", provider) ?? [];
    const depsFormatted = deps.map(dependenciesToString);
    return {
        label: chalk.yellow(provider.name),
        nodes: depsFormatted
    };
}

export function dependencyTreeToString(tree: DependencyTreeNode): string {
    const fn = (tree: DependencyTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: [...tree.providersOwn.map(dependenciesToString), ...tree.children.map(fn)]
        };
    };
    return archy(fn(tree));
}
