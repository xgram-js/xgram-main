import { DependencyTreeNode, ModuleImportTreeNode } from "@/decorators/module";
import archy from "archy";
import chalk from "chalk";

export function moduleImportTreeToString(tree: ModuleImportTreeNode): string {
    const fn = (tree: ModuleImportTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: tree.children.map(fn)
        };
    };
    return archy(fn(tree));
}

export function dependencyTreeToString(tree: DependencyTreeNode): string {
    const fn = (tree: DependencyTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: [
                ...tree.providersOwn.map(v => {
                    return {
                        label: chalk.yellow(v.name)
                    };
                }),
                ...tree.children.map(fn)
            ]
        };
    };
    return archy(fn(tree));
}
