import { Class } from "@xgram/types";
import { CONTROLLER_COMMANDS, ControllerCommandsMetadata } from "@/decorators/controller/command";
import { ArgDefinitionMetadata, COMMAND_ARGS } from "@/decorators/controller/command/arg";

export interface ControllerMetadata {}

export const CONTROLLER_METADATA = Symbol("controller:metadata");
export const CONTROLLER_MODULE_DEFINITOR = Symbol("controller:module_definitor");

export default function Controller(metadata?: ControllerMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, metadata, target);

        const commands = (Reflect.getOwnMetadata(CONTROLLER_COMMANDS, target) ?? []) as ControllerCommandsMetadata[];
        commands.forEach(cmd => {
            const args = (Reflect.getOwnMetadata(COMMAND_ARGS, cmd.fn) ?? []) as ArgDefinitionMetadata[];
            args.sort((a, b) => a.argIndex - b.argIndex);
            Reflect.defineMetadata(COMMAND_ARGS, args, cmd.fn);
        });
    };
}

export function isControllerClass(controller: Class) {
    return Reflect.hasOwnMetadata(CONTROLLER_METADATA, controller);
}
