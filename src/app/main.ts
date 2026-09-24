import { settings } from "../config/settings";
import { runBot } from "./run-bot";

async function main(): Promise<void> {
    await runBot(settings);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});2