import { Class } from "@/types/class";

export interface ControllerMetadata {}

export const CONTROLLER_METADATA = Symbol("controller:metadata");

export default function Controller(metadata?: ControllerMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, metadata, target);
    };
}

export function isControllerClass(provider: Class) {
    return Reflect.hasOwnMetadata(CONTROLLER_METADATA, provider);
}
