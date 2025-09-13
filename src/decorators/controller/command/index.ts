import { Class } from "@/types/class";
import { Message } from "typescript-telegram-bot-api";
import { BaseContext } from "@/types/context";
import chalk from "chalk";

export const COMMAND_DEFINITOR_CONTROLLER = Symbol("command:definitor_controller");
export const CONTROLLER_COMMANDS = Symbol("controller:commands");
export type ControllerCommandsMetadata = {
    trigger: string | RegExp;
    fn: (ctx: CommandContext) => void | Promise<void>;
};

export default function Command(trigger: string | RegExp): MethodDecorator {
    return function (target, propertyKey, descriptor) {
        const cls = target.constructor as Class;
        const fn = descriptor.value as (...args: any[]) => any;

        if (typeof trigger === "string") {
            if (trigger.includes(" "))
                throw new Error(
                    `Command trigger can not include spaces (caused by ${fn.name} in ${chalk.green(cls.name)}`
                );
        }

        Reflect.defineMetadata(COMMAND_DEFINITOR_CONTROLLER, cls, fn);

        const currentCommands =
            (Reflect.getOwnMetadata(CONTROLLER_COMMANDS, cls) as ControllerCommandsMetadata[]) ?? [];
        Reflect.defineMetadata(
            CONTROLLER_COMMANDS,
            [...currentCommands, { trigger, fn } satisfies ControllerCommandsMetadata],
            cls
        );
    };
}

export interface CommandContext extends BaseContext {
    message: Message;
    menuEntryPoint: (menu: Class, entryPoint: string, ...args: any[]) => void;
    reply: (text: string) => Promise<Message>;
}
