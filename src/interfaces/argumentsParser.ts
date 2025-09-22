import { ArgumentsMap } from "@/commandsMapper/argumentsMapper";
import { ReplyWithError } from "@/errors";

export type ArgumentsParsingResult = {
    value: string;
};

export interface ArgumentsParser {
    parse: (argsString: string, map: ArgumentsMap) => ArgumentsParsingResult[];
}

export class DefaultArgumentsParser implements ArgumentsParser {
    public parse(argsString: string, map: ArgumentsMap): ArgumentsParsingResult[] {
        const args = argsString.split(" ");
        if (args.length != map.length) throw new ReplyWithError("Failed to parse arguments.");

        const result: ArgumentsParsingResult[] = [];

        for (let i = 0; i < args.length; i++) {
            const mapMember = map[i];
            const argValue = args[i];

            let convertedValue;
            try {
                convertedValue = mapMember.type.onConversion(argValue);
            } catch {
                throw new ReplyWithError("Failed to parse arguments.");
            }
            result.push({ value: convertedValue });
        }
        return result;
    }
}
