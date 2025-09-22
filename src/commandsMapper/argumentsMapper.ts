import { ArgDefinitionMetadata, ArgumentType } from "@/decorators/controller/command/arg";
export type ArgumentsMapMember = {
    type: ArgumentType;
};
export type ArgumentsMap = ArgumentsMapMember[];

export function mapArguments(argumentsMetadata: ArgDefinitionMetadata[]): ArgumentsMap {
    return argumentsMetadata.map(v => {
        return { type: v.argumentType };
    });
}
