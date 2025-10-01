import type { Message } from "typescript-telegram-bot-api";
import type Bot from "@/bot";
import { DependencyTreeNode } from "@/decorators/module";
import {
    COMMAND_DEFINITOR_CONTROLLER,
    CommandContext,
    CONTROLLER_COMMANDS,
    ControllerCommandsMetadata
} from "@/decorators/controller/command";
import { type LoggerLike } from "@/logger";
import chalk from "chalk";
import { Class, getClassOfInstance, InstanceOf } from "@xgram/types";
import { ReplyWithError } from "@/errors";
import { isControllerClass } from "@/decorators/controller";
import { ArgumentsMap, mapArguments } from "@/commandsMapper/argumentsMapper";
import { type ArgDefinitionMetadata, COMMAND_ARGS } from "@/decorators/controller/command/arg";
import { DefaultArgumentsParser } from "@/interfaces/argumentsParser";
import { InstanceStorage } from "@/instanceStorage";
import { Injectable, InjectKey } from "@xgram/di";

export type CommandDeclaration = {
    handler: (ctx: CommandContext, ...args: string[]) => void | Promise<void>;
    handleSyntax: CommandHandleSyntax;
    argumentsMap: ArgumentsMap;
};

export enum CommandHandleSyntax {
    defaultOnly,
    extendedOnly,
    both
}

@Injectable()
export class CommandsMapper {
    public constructor(@InjectKey("logger") private readonly logger: LoggerLike) {}

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
        const ctx: CommandContext = {
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
        };

        const inlineHandler = async () => {
            const args = new DefaultArgumentsParser().parse(
                (message.text ?? "").split(" ").slice(1).join(" "),
                command.argumentsMap
            );
            if (args.length != command.argumentsMap.length) throw new Error("Wrong arguments");
            await command.handler(ctx, ...args.map(v => v.value));
        };

        try {
            await inlineHandler();
        } catch (err) {
            if (err instanceof ReplyWithError) await ctx.reply(err.text);
            else throw err;
        }
    }

    public mapController(controllerInstance: InstanceOf) {
        const controller = getClassOfInstance(controllerInstance);
        if (!isControllerClass(controller))
            throw new Error(
                `Controller class must be decorated with @Controller() (caused by ${chalk.green(controller.name)})`
            );
        const commands = (Reflect.getOwnMetadata(CONTROLLER_COMMANDS, controller) ??
            []) as ControllerCommandsMetadata[];
        commands.map(cmd => {
            if (this.mapping.has(cmd.trigger)) {
                throw new Error(
                    `Command /${cmd.trigger} is defined multiply times (${chalk.green(controller.name)}, ${chalk.green((Reflect.getOwnMetadata(COMMAND_DEFINITOR_CONTROLLER, this.mapping.get(cmd.trigger)!.handler) as Class).name)})`
                );
            }

            const commandArgs = (Reflect.getOwnMetadata(COMMAND_ARGS, cmd.fn) ?? []) as ArgDefinitionMetadata[];

            // TODO: add RegExp testing
            this.mapping.set(cmd.trigger, {
                handler: cmd.fn.bind(controllerInstance),
                handleSyntax: CommandHandleSyntax.both,
                argumentsMap: mapArguments(commandArgs)
            });
            this.logger.log(
                "CommandMapper",
                `Mapped command /${cmd.trigger} ${commandArgs.map(v => `{${v.argIndex}}`).join(" ")}`
            );
        });
    }

    public mapModule(instanceStorage: InstanceStorage, module: DependencyTreeNode) {
        module.controllers.map(v => this.mapController(instanceStorage.getControllerInstance(v, module)));
        module.children.map(v => this.mapModule(instanceStorage, v));
    }
}
