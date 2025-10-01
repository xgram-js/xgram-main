import { buildDependencyTree, buildModuleImportTree, isModuleClass } from "@/decorators/module";
import { Class } from "@xgram/types";
import Bot from "@/bot";
import { InstanceStorage } from "@/instanceStorage";
import chalk from "chalk";
import { dependencyTreeToString } from "@/utils";
import { ConsoleLogger, LoggerLike } from "@/logger";
import { CommandsMapper } from "@/commandsMapper";
import { Container } from "@xgram/di";

export interface BotFactoryCreateOptions {
    token: string;
    logger?: LoggerLike;
}

export abstract class BotFactory {
    public static async create(rootModule: Class, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule))
            throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(rootModule.name)})`);

        const container = new Container();

        const logger = options.logger ?? new ConsoleLogger({ prefix: "Main" });
        container.registerCustomKeyInstance(logger, "logger");

        logger.log("BotFactory", `Building dependency tree for module ${chalk.cyan(rootModule.name)}`);
        const moduleImportTree = buildModuleImportTree(rootModule);
        const dependencyTree = buildDependencyTree(moduleImportTree);
        logger.log("BotFactory", `\n` + dependencyTreeToString(dependencyTree));

        const instanceStorage = container.resolve(InstanceStorage);
        instanceStorage.resolveForModule(rootModule, dependencyTree);

        const commandsMapper = container.resolve(CommandsMapper);
        commandsMapper.mapModule(instanceStorage, dependencyTree);

        return new Bot(new rootModule(), options.token, options.logger ?? logger, {
            onCommand: (bot, message) => commandsMapper.handleMessage(bot, message)
        });
    }
}
