import { DependencyTreeNode, ModuleImportTreeNode } from "@/decorators/module";
import archy from "archy";
import chalk from "chalk";
import { Class } from "@xgram/types";
import { isProviderClass } from "@/decorators/provider";

export function moduleImportTreeToString(tree: ModuleImportTreeNode): string {
    const fn = (tree: ModuleImportTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: tree.children.map(fn)
        };
    };
    return archy(fn(tree));
}

export function moduleMemberToString(member: Class): archy.Data {
    const deps = Reflect.getOwnMetadata("design:paramtypes", member) ?? [];
    const depsFormatted = deps.map(moduleMemberToString);
    const color = isProviderClass(member) ? chalk.yellow : chalk.green;
    return {
        label: color(member.name),
        nodes: depsFormatted
    };
}

export function dependencyTreeToString(tree: DependencyTreeNode): string {
    const fn = (tree: DependencyTreeNode): archy.Data => {
        return {
            label: chalk.cyan(tree.thisModule.name),
            nodes: [
                ...tree.controllers.map(moduleMemberToString),
                ...tree.providersOwn.map(moduleMemberToString),
                ...tree.children.map(fn)
            ]
        };
    };
    return archy(fn(tree));
}
