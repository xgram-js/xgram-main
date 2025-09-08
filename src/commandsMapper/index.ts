import type { Message } from "typescript-telegram-bot-api";
import type Bot from "@/bot";
import { DependencyTreeNode } from "@/decorators/module";
import {
    COMMAND_DEFINITOR_CONTROLLER,
    CommandContext,
    CONTROLLER_COMMANDS,
    ControllerCommandsMetadata
} from "@/decorators/controller/command";
import { LoggerLike } from "@/logger";
import chalk from "chalk";
import { Class } from "@/types/class";

export type CommandDeclaration = {
    handler: (ctx: CommandContext) => void | Promise<void>;
    handleSyntax: CommandHandleSyntax;
};

export enum CommandHandleSyntax {
    defaultOnly,
    extendedOnly,
    both
}

export class CommandsMapper {
    public constructor(private readonly logger: LoggerLike) {}

    private readonly mapping: Map<string | RegExp, CommandDeclaration> = new Map();

    public async handleMessage(bot: Bot, message: Message) {
        const text = message.text;
        if (!text || !text.startsWith("/")) return;
        const command = text.split(" ")[0].slice(1);
        if (command.length == 0) return;
        if (command.includes("@")) {
            const commandSplit = command.split("@");
            if (commandSplit.length != 2) return;
            const [commandHeader, commandMention] = commandSplit;

            if ((await bot.apiInterface.getMe()).username != commandMention) return;

            let cmd: CommandDeclaration | undefined;
            this.mapping.entries().forEach(([k, v]) => {
                if (v.handleSyntax == CommandHandleSyntax.defaultOnly) return;
                if (typeof k === "string") {
                    if (k == commandHeader) cmd = v;
                } else if (commandHeader.match(k)) cmd = v;
            });
            if (cmd) return this.handleCommand(bot, message, cmd);
        } else {
            let cmd: CommandDeclaration | undefined;
            this.mapping.entries().forEach(([k, v]) => {
                if (v.handleSyntax == CommandHandleSyntax.extendedOnly) return;
                if (typeof k === "string") {
                    if (k == command) cmd = v;
                } else if (command.match(k)) cmd = v;
            });
            if (cmd) return this.handleCommand(bot, message, cmd);
        }
    }

    public async handleCommand(bot: Bot, message: Message, command: CommandDeclaration) {
        await command.handler({
            bot: bot,
            message: message,
            reply: async text =>
                await bot.apiInterface.sendMessage({
                    text,
                    chat_id: message.chat.id,
                    reply_parameters: { message_id: message.message_id }
                }),
            menuEntryPoint: function (menu: Class, entryPoint: string, ...args: any[]): void {
                throw new Error("Function not implemented.");
            }
        });
    }

    public mapModule(module: DependencyTreeNode) {
        module.controllers.map(v => {
            const commands = (Reflect.getOwnMetadata(CONTROLLER_COMMANDS, v) ?? []) as ControllerCommandsMetadata[];
            commands.map(cmd => {
                if (this.mapping.has(cmd.trigger)) {
                    throw new Error(
                        `Command /${cmd.trigger} is defined multiply times (${chalk.green(v.name)}, ${chalk.green((Reflect.getOwnMetadata(COMMAND_DEFINITOR_CONTROLLER, this.mapping.get(cmd.trigger)!.handler) as Class).name)})`
                    );
                }
                // TODO: add RegExp testing
                this.mapping.set(cmd.trigger, { handler: cmd.fn, handleSyntax: CommandHandleSyntax.both });
                this.logger.log("CommandMapper", `Mapped command /${cmd.trigger}`);
            });
        });
        module.children.map(v => this.mapModule(v));
    }
}
