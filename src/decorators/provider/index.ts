import { Class } from "@/types/class";

export interface ProviderMetadata {}

export const PROVIDER_METADATA = Symbol("provider:metadata");

export default function Provider(metadata?: ProviderMetadata) {
    return (target: Class) => {
        Reflect.defineMetadata(PROVIDER_METADATA, metadata, target);
    };
}

export function isProviderClass(provider: Class) {
    return Reflect.hasOwnMetadata(PROVIDER_METADATA, provider);
}
