import * as fs from "fs";
import * as path from "path";

import { LocalBotConfig } from "../domain/schedule";
import { WindowsTaskService } from "../infra/windows-task.service";
import { ScheduleSyncService } from "../scheduler/schedule-sync.service";

function carregarConfigLocal(): LocalBotConfig {
    const configPath = path.resolve(process.cwd(), "local-bot.config.json");

    if (!fs.existsSync(configPath)) {
        throw new Error(`Arquivo de configuração local não encontrado: ${configPath}`);
    }

    return JSON.parse(fs.readFileSync(configPath, "utf8")) as LocalBotConfig;
}

async function main(): Promise<void> {
    const config = carregarConfigLocal();
    const windowsTaskService = new WindowsTaskService();
    const syncService = new ScheduleSyncService(windowsTaskService, process.cwd());

    await syncService.sync(config);

    console.log("Agenda sincronizada com o Agendador do Windows.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});