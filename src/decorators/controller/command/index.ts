import { Class } from "@/types/class";
import { Message } from "typescript-telegram-bot-api";
import { BaseContext } from "@/types/context";
import { Function } from "@/types/function";

export const CONTROLLER_COMMANDS = Symbol("controller:commands");
export type ControllerCommandsMetadata = { trigger: string | RegExp; fn: Function };

export default function Command(trigger: string | RegExp): MethodDecorator {
    return function (target, propertyKey, descriptor) {
        const cls = target.constructor as Class;
        const fn = descriptor.value as Function;

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
}
