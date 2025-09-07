import { isModuleClass } from "@/decorators/module";
import { TelegramBot } from "typescript-telegram-bot-api";
import { LoggerLike } from "@/logger";

export default class Bot {
    public constructor(
        rootModule: any,
        private readonly token: string,
        private readonly logger: LoggerLike
    ) {
        if (!isModuleClass(rootModule.constructor))
            throw new Error(`Module class must be decorated with @Module() (caused by ${rootModule.name})`);
        this.apiInterface = new TelegramBot({ botToken: this.token });
    }

    private apiInterface: TelegramBot;

    public async run() {
        this.logger.log("Bot", "Starting bot...");
        await this.apiInterface.startPolling();
    }

    public async stop() {
        await this.apiInterface.stopPolling();
    }
}
