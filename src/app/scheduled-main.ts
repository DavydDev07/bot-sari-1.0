import * as fs from "fs";
import * as path from "path";

import { SchedulerService } from "../scheduler/scheduler.service";
import { construirBotConfigDeExecucao } from "../scheduler/task-runner";
import { runBot } from "./run-bot";
import { LocalBotConfig } from "../domain/schedule";
import { TarefaAgendada } from "../domain/scheduled-task";

function carregarConfigLocal(): LocalBotConfig {
    const configPath = path.resolve(process.cwd(), "local-bot.config.json");

    if (!fs.existsSync(configPath)) {
        throw new Error(
            `Arquivo de configuração local não encontrado: ${configPath}`
        );
    }

    let raw: string;
    try {
        raw = fs.readFileSync(configPath, "utf-8");
    } catch (error) {
        throw new Error(
            `Não foi possível ler o arquivo de configuração local: ${configPath}`
        );
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error(
            `JSON inválido no arquivo de configuração local: ${configPath}`
        );
    }

    validarConfigLocal(parsed);

    return parsed;
}

function validarConfigLocal(config: unknown): asserts config is LocalBotConfig {
    if (!config || typeof config !== "object") {
        throw new Error("A configuração local precisa ser um objeto JSON válido.");
    }

    const cfg = config as Record<string, any>;

    if (!cfg.profile || typeof cfg.profile !== "object") {
        throw new Error("Campo 'profile' ausente ou inválido.");
    }

    if (!cfg.profile.login || typeof cfg.profile.login !== "string") {
        throw new Error("Campo 'profile.login' ausente ou inválido.");
    }

    const category = 
        typeof cfg.profile.category === "string"
        ? cfg.profile.category.trim().toLowerCase()
        : "";
    
        const categoriasValidas = [
            "aluno_manha_tarde",
            "aluno_noite",
            "geral"
        ];

    if (categoriasValidas.includes(category)) {
        throw new Error(
            `Campo 'profile.category' inválido: "${cfg.profile.category}". ` + 
            `Valores permitidos: ${categoriasValidas.join(", ")}.`  
        );
    }

    cfg.profile.category = category;

    if (
        !cfg.profile.category ||
        !["aluno_manha_tarde", "aluno_noite", "geral"].includes(cfg.profile.category)
    ) {
        throw new Error("Campo 'profile.category' inválido.");
    }

    for (const key of ["almoco", "jantar"]) {
        if (!cfg[key] || typeof cfg[key] !== "object") {
            throw new Error(`Campo '${key}' ausente ou inválido.`);
        }

        if (typeof cfg[key].habilitada !== "boolean") {
            throw new Error(`Campo '${key}.habilitada' ausente ou inválido.`);
        }

        if (!Array.isArray(cfg[key].dias)) {
            throw new Error(`Campo '${key}.dias' ausente ou inválido.`);
        }
    }

    if (!cfg.politicaDeRepeticao || typeof cfg.politicaDeRepeticao !== "object") {
        throw new Error("Campo 'politicaDeRepeticao' ausente ou inválido.");
    }

    if (typeof cfg.politicaDeRepeticao.ativado !== "boolean") {
        throw new Error("Campo 'politicaDeRepeticao.ativado' ausente ou inválido.");
    }

    if (typeof cfg.politicaDeRepeticao.maxDeTentativas !== "number") {
        throw new Error("Campo 'politicaDeRepeticao.maxDeTentativas' ausente ou inválido.");
    }

    if (typeof cfg.politicaDeRepeticao.tempDeEsperaEntreTentativas !== "number") {
        throw new Error("Campo 'politicaDeRepeticao.tempDeEsperaEntreTentativas' ausente ou inválido.");
    }

    if (typeof cfg.SalvarCapturasDeTelaEmCasoDeErro !== "boolean") {
        throw new Error("Campo 'SalvarCapturasDeTelaEmCasoDeErro' ausente ou inválido.");
    }

    if (typeof cfg.SalvarLogs !== "boolean") {
        throw new Error("Campo 'SalvarLogs' ausente ou inválido.");
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executarComPoliticaDeRepeticao(
    configLocal: LocalBotConfig,
    tarefa: TarefaAgendada
): Promise<void> {
    const politica = configLocal.politicaDeRepeticao;
    const maxTentativas = politica.ativado
        ? Math.max(1, Math.trunc(politica.maxDeTentativas))
        : 1;
    const esperaMs = Math.max(0, politica.tempDeEsperaEntreTentativas) * 1000;

    let ultimoErro: unknown;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
        try {
            console.log(`Tentativa ${tentativa}/${maxTentativas} para a tarefa ${tarefa.id}.`);
            const botConfig = construirBotConfigDeExecucao(configLocal, tarefa);
            await runBot(botConfig);
            return;
        } catch (error) {
            ultimoErro = error;

            if (tentativa >= maxTentativas) {
                break;
            }

            console.warn(
                `Tentativa ${tentativa}/${maxTentativas} falhou. ` +
                `Nova tentativa em ${politica.tempDeEsperaEntreTentativas}s.`
            );
            await sleep(esperaMs);
        }
    }

    throw ultimoErro instanceof Error
        ? ultimoErro
        : new Error(String(ultimoErro ?? "Falha desconhecida durante a execução."));
}

async function main() {
    const configLocal: LocalBotConfig = carregarConfigLocal();
    const scheduler = new SchedulerService(configLocal);

    scheduler.carregarTasks();
    scheduler.marcarTarefasExpiradas();

    //console.log(scheduler.obterTarefas());
    
    const tarefa = scheduler.obterProximaTarefaPendente();
    if (!tarefa) {
        console.log("Nenhuma tarefa pendente para executar agora.");
        return;
    }

    scheduler.marcarTarefaEmExecução(tarefa.id);

    try {
        await executarComPoliticaDeRepeticao(configLocal, tarefa);
        scheduler.marcarTarefaSucesso(tarefa.id);
    } catch (error) {
        scheduler.marcarTarefaFalhou(tarefa.id);
        throw error;
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});