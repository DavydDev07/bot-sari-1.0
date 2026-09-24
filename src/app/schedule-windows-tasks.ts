import * as fs from "fs";
import * as path from "path";

import { SchedulerService } from "../scheduler/scheduler.service";
import { LocalBotConfig } from "../domain/schedule";
import { WindowsTaskService } from "../infra/windows-task.service";

function carregarConfigLocal(): LocalBotConfig {
    const configPath = path.resolve(process.cwd(), "local-bot.config.json");

    if (!fs.existsSync(configPath)) {
        throw new Error(`Arquivo de configuração local não encontrado: ${configPath}`);
    }

    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as LocalBotConfig;

    return parsed;
}

function formatarDataParaWindows(date: Date): string {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

function formatarHoraParaWindows(date: Date): string {
    const hora = String(date.getHours()).padStart(2, "0");
    const minuto = String(date.getMinutes()).padStart(2, "0");

    return `${hora}:${minuto}`;
}

function construirComandoDaTask(): string {
    const projectRoot = process.cwd();

    return `npm --prefix "${projectRoot}" run scheduled`;
}

async function main(): Promise<void> {
    const configLocal = carregarConfigLocal();
    const scheduler = new SchedulerService(configLocal);
    const windowsTaskService = new WindowsTaskService();

    scheduler.carregarTasks();
    scheduler.marcarTarefasExpiradas();

    const agora = new Date();

    const tarefas = scheduler
        .obterTarefas()
        .filter((tarefa) => new Date(tarefa.executarEm) > agora);

    const command = construirComandoDaTask();

    const antigas = await windowsTaskService.listBotSariTasks();
    for (const taskName of antigas) {
        await windowsTaskService.deleteTask(taskName);
        console.log(`Task removida: ${taskName}`);
    }

    for (const tarefa of tarefas) {
        const executarEm = new Date(tarefa.executarEm);

        await windowsTaskService.createTask({
            taskName: `botSari-${tarefa.id}`,
            command,
            startDate: formatarDataParaWindows(executarEm),
            startTime: formatarHoraParaWindows(executarEm),
            description: `Bot SARI - ${tarefa.refeicao} - ticket ${tarefa.ticketDate}`
        });

        console.log(
            `Task criada: botSari-${tarefa.id} -> ${formatarDataParaWindows(executarEm)} ${formatarHoraParaWindows(executarEm)}`
        );
    }

    console.log(`Sincronização concluída. ${tarefas.length} task(s) registradas.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});