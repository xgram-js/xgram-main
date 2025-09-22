import { Class, ExtendedAbstractClass, getClassMethods, InstanceOf } from "@/types/class";
import chalk from "chalk";
import assert from "node:assert";

export const COMMAND_ARGS = Symbol("command:args");
export type ArgDefinitionMetadata = {
    argIndex: number;
    argumentType: ArgumentType;
};

export abstract class BaseArgumentType {
    public abstract onConversion(value: string): any;
}

export type ArgumentType = InstanceOf<ExtendedAbstractClass<typeof BaseArgumentType>>;

export namespace BuiltInArgumentTypes {
    export class NumberArgumentType extends BaseArgumentType {
        public override onConversion(value: string): number {
            const n = parseInt(value);
            assert(!isNaN(n));
            return parseInt(value);
        }
    }

    export class StringArgumentType extends BaseArgumentType {
        public override onConversion(value: string): string {
            return value;
        }
    }
}

export function getBuiltInArgumentType(value: any): ArgumentType {
    switch (typeof value) {
        case "number":
            return new BuiltInArgumentTypes.NumberArgumentType();
        case "string":
            return new BuiltInArgumentTypes.StringArgumentType();
        default:
            throw new Error();
    }
}

export interface ArgOptions {
    argumentType?: ArgumentType;
}

export default function Arg(options?: ArgOptions): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        const cls = target.constructor as Class;
        if (typeof propertyKey !== "string")
            throw new Error(`Something went wrong: @Arg() received an empty propertyKey in ${chalk.green(cls.name)}`);
        const method = getClassMethods(cls).find(v => v.name == propertyKey);
        if (!method)
            throw new Error(`Something went wrong: @Arg() received an invalid propertyKey in ${chalk.green(cls.name)}`);
        if (parameterIndex == 0)
            throw new Error(
                `First argument of @Command() method must be a context. It can not be decorated with @Arg() (caused by ${chalk.green(cls.name)})`
            );

        console.log(Reflect.getMetadataKeys(target, propertyKey));
        console.log(Reflect.getOwnMetadata("design:paramtypes", target, propertyKey));

        const paramTypes = Reflect.getOwnMetadata("design:paramtypes", target, propertyKey);

        const currentArgs = (Reflect.getOwnMetadata(COMMAND_ARGS, method) as ArgDefinitionMetadata[]) ?? [];
        Reflect.defineMetadata(
            COMMAND_ARGS,
            [
                ...currentArgs,
                {
                    argIndex: parameterIndex - 1,
                    argumentType: options?.argumentType ?? getBuiltInArgumentType(paramTypes[parameterIndex]())
                } satisfies ArgDefinitionMetadata
            ],
            method
        );
    };
}
