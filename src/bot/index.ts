import { isModuleClass } from "@/decorators/module";
import { Message, TelegramBot } from "typescript-telegram-bot-api";
import { LoggerLike } from "@/logger";

export type BotHandlers = {
    onCommand: (bot: Bot, message: Message) => void | Promise<void>;
};

export default class Bot {
    public constructor(
        rootModule: any,
        private readonly token: string,
        private readonly logger: LoggerLike,
        private readonly handlers: BotHandlers
    ) {
        if (!isModuleClass(rootModule.constructor))
            throw new Error(`Module class must be decorated with @Module() (caused by ${rootModule.name})`);
        this.apiInterface = new TelegramBot({ botToken: this.token });
        this.apiInterface.on("message", async message => await this.handlers.onCommand(this, message));
    }

    public readonly apiInterface: TelegramBot;

    public async run() {
        this.logger.log("Bot", "Starting bot...");
        await this.apiInterface.startPolling();
    }

    public async stop() {
        await this.apiInterface.stopPolling();
        this.logger.log("Bot", "Bot stopped");
    }
}
