import { isModuleClass } from "@/decorators/module";

export default class Bot {
    constructor(rootModule: any) {
        if (!isModuleClass(rootModule.constructor))
            throw new Error(`Module class must be decorated with @Module() (caused by ${rootModule.name})`);
    }

    async run() {}
}
