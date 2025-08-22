import { isModuleClass } from "@/decorators/module";
import { Class } from "@/types/class";
import Bot from "@/bot";

export interface BotFactoryCreateOptions {
    token: string;
}

export abstract class BotFactory {
    static async create(rootModule: Class, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule))
            throw new Error(`Module class must be decorated with @Module() (caused by ${rootModule.name})`);

        return new Bot();
    }
}
