import * as fs from "fs";
import * as path from "path";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class Logger {
    private readonly logFilePath: string;

    constructor(logsDir: string) {
        fs.mkdirSync(logsDir, { recursive: true });

        const fileName = `run-${new Date().toISOString().replace(/[.:]/g, "-")}.log`;
        this.logFilePath = path.join(logsDir, fileName);
    }

    private write(level: LogLevel, message: string): void {
        const line = `[${new Date().toISOString()}] [${level}] ${message}`;
        console.log(line);
        fs.appendFileSync(this.logFilePath, line + "\n", "utf8");
    }

    info(message: string): void {
        this.write("INFO", message);
    }

    warn(message: string): void {
        this.write("WARN", message);
    }

    error(message: string, details?: unknown): void {
        if (details === undefined) {
            this.write("ERROR", message);
            return;
        }

        const serializedDetails =
            details instanceof Error
                ? details.stack ?? details.message
                : typeof details === "string"
                    ? details
                    : JSON.stringify(details);

        this.write("ERROR", `${message} | ${serializedDetails}`);
    }

    debug(message: string): void {
        this.write("DEBUG", message);
    }
}
