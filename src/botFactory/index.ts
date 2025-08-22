import { isModuleClass, MODULE_METADATA } from "@/decorators/module";
import { Class } from "@/types/class";
import Bot from "@/bot";
import { InstanceStorage } from "@/instanceStorage";

export interface BotFactoryCreateOptions {
    token: string;
}

export abstract class BotFactory {
    static async create(rootModule: Class, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule))
            throw new Error(`Module class must be decorated with @Module() (caused by ${rootModule.name})`);

        const rootModuleMetadata = Reflect.getOwnMetadata(MODULE_METADATA, rootModule);

        const instanceStorage = new InstanceStorage();
        instanceStorage.resolveForModule(rootModule);

        return new Bot(new rootModule());
    }
}
