import { Class, getClassMethods } from "@/types/class";
import chalk from "chalk";

export const COMMAND_ARGS = Symbol("command:args");
export type ArgDefinitionMetadata = {
    argIndex: number;
};

export default function Arg(): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        const cls = target.constructor as Class;
        if (typeof propertyKey !== "string")
            throw new Error(`Something went wrong: @Arg() received an empty propertyKey in ${chalk.green(cls.name)}`);
        const method = getClassMethods(cls).find(v => v.name == propertyKey);
        if (!method)
            throw new Error(`Something went wrong: @Arg() received an invalid propertyKey in ${chalk.green(cls.name)}`);
        if (parameterIndex == 0)
            throw new Error(
                `First argument of @Command method must be a context. It can not be decorated with @Arg (caused by ${chalk.green(cls.name)})`
            );

        const currentArgs = (Reflect.getOwnMetadata(COMMAND_ARGS, method) as ArgDefinitionMetadata[]) ?? [];
        Reflect.defineMetadata(
            COMMAND_ARGS,
            [...currentArgs, { argIndex: parameterIndex - 1 } satisfies ArgDefinitionMetadata],
            method
        );
    };
}
