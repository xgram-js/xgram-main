import { Class } from "@/types/class";
import { CONTROLLER_COMMANDS, ControllerCommandsMetadata } from "@/decorators/controller/command";

export interface ControllerMetadata {}

export const CONTROLLER_METADATA = Symbol("controller:metadata");

export default function Controller(metadata?: ControllerMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, metadata, target);

        const commands = (Reflect.getOwnMetadata(CONTROLLER_COMMANDS, target) ?? []) as ControllerCommandsMetadata[]; // for later use
    };
}

export function isControllerClass(controller: Class) {
    return Reflect.hasOwnMetadata(CONTROLLER_METADATA, controller);
}
