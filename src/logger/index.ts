import chalk from "chalk";
import { Injectable } from "@xgram/di";

export interface LoggerLike {
    debug(context: string, ...args: any[]): void;
    log(context: string, ...args: any[]): void;
    warn(context: string, ...args: any[]): void;
    error(context: string, ...args: any[]): void;
}

export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export interface ConsoleLoggerOptions {
    prefix: string;
}

@Injectable()
export class ConsoleLogger implements LoggerLike {
    public constructor(private readonly options: ConsoleLoggerOptions) {}

    protected doLog(level: LogLevel, context: string, ...args: any[]) {
        const func =
            level == LogLevel.DEBUG
                ? console.debug
                : level == LogLevel.INFO
                  ? console.info
                  : level == LogLevel.WARN
                    ? console.warn
                    : console.error;
        func(this.getPrefix(level, context), ...args);
    }

    protected getPrefix(level: LogLevel, context: string) {
        const date = new Date();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${chalk.green(`[${hours}:${minutes}:${seconds}]`)} ${chalk.green(`[${this.options.prefix}]`)} ${chalk.yellow(`[${context}]`)}`;
    }

    public debug = (context: string, ...args: any[]) => this.doLog(LogLevel.DEBUG, context, ...args);
    public log = (context: string, ...args: any[]) => this.doLog(LogLevel.INFO, context, ...args);
    public warn = (context: string, ...args: any[]) => this.doLog(LogLevel.WARN, context, ...args);
    public error = (context: string, ...args: any[]) => this.doLog(LogLevel.ERROR, context, ...args);
}
