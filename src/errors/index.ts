export class ReplyWithError extends Error {
    constructor(public readonly text: string) {
        super();
    }
}
