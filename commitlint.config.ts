import { UserConfig } from "@commitlint/types";
const Configuration: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    formatter: "@commitlint/format",
    rules: {
        "type-enum": [
            2,
            "always",
            ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]
        ],
        "body-max-line-length": [2, "always", Infinity]
    }
};

export default Configuration;
