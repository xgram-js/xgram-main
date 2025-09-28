import { buildDependencyTree, buildModuleImportTree, isModuleClass } from "@/decorators/module";
import { Class, getClassOfInstance } from "@xgram/types";
import Bot from "@/bot";
import { InstanceStorage } from "@/instanceStorage";
import chalk from "chalk";
import { dependencyTreeToString } from "@/utils";
import { ConsoleLogger, LoggerLike } from "@/logger";
import { CommandsMapper } from "@/commandsMapper";
import { Container, isInjectable } from "@xgram/di";

export interface BotFactoryCreateOptions {
    token: string;
    logger?: LoggerLike;
}

export abstract class BotFactory {
    public static async create(rootModule: Class, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule))
            throw new Error(`Module class must be decorated with @Module() (caused by ${chalk.cyan(rootModule.name)})`);

        const container = new Container();
        let logger: LoggerLike;

        if (options.logger) {
            const cls = getClassOfInstance(options.logger);
            if (!isInjectable(cls))
                throw new Error(`Logger ${cls.name} is not decorated with ${chalk.yellow("@Injectable()")}`);
            logger = options.logger;
        } else logger = new ConsoleLogger({ prefix: "Main" });

        logger.log("BotFactory", `Building dependency tree for module ${chalk.cyan(rootModule.name)}`);
        const moduleImportTree = buildModuleImportTree(rootModule);
        const dependencyTree = buildDependencyTree(moduleImportTree);
        logger.log("BotFactory", `\n` + dependencyTreeToString(dependencyTree));

        const instanceStorage = new InstanceStorage(logger);
        instanceStorage.resolveForModule(rootModule, dependencyTree);

        const commandsMapper = new CommandsMapper(logger);
        commandsMapper.mapModule(dependencyTree);

        return new Bot(new rootModule(), options.token, options.logger ?? logger, {
            onCommand: (bot, message) => commandsMapper.handleMessage(bot, message)
        });
    }
}
