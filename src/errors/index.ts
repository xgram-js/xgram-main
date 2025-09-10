export class ReplyWithError extends Error {
    public constructor(public readonly text: string) {
        super();
    }
}
