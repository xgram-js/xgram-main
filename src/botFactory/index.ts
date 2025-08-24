import { buildDependencyTree, buildModuleImportTree, isModuleClass, MODULE_METADATA } from "@/decorators/module";
import { Class } from "@/types/class";
import Bot from "@/bot";
import { InstanceStorage } from "@/instanceStorage";
import chalk from "chalk";
import { dependencyTreeToString } from "@/utils";
import * as util from "node:util";

export interface BotFactoryCreateOptions {
    token: string;
}

export abstract class BotFactory {
    static async create(rootModule: Class, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule))
            throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(rootModule.name)})`);

        const rootModuleMetadata = Reflect.getOwnMetadata(MODULE_METADATA, rootModule);

        console.log(`Building dependency tree for module ${chalk.cyan(rootModule.name)}`);
        const moduleImportTree = buildModuleImportTree(rootModule);
        const dependencyTree = buildDependencyTree(moduleImportTree);
        console.log(util.inspect(dependencyTree, { depth: null, colors: true }));
        console.log(dependencyTreeToString(dependencyTree));

        const instanceStorage = new InstanceStorage();
        instanceStorage.resolveForModule(rootModule);

        return new Bot(new rootModule(), options.token);
    }
}
