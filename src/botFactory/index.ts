import { isModuleClass } from "@/decorators/module";

export interface BotFactoryCreateOptions {
    token: string;
}

export abstract class BotFactory {
    static async create(rootModule: { new (...args: any[]): any }, options: BotFactoryCreateOptions) {
        if (!isModuleClass(rootModule)) throw new Error("Module class must be decorated with @Module()")
    }

    static async run() {

    }
}
