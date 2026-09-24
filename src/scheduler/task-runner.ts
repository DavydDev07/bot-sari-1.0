import { TarefaAgendada } from "../domain/scheduled-task";
import { LocalBotConfig } from "../domain/schedule";
import { BotConfig } from "../core/types";
import { settings } from "../config/settings";

export function construirBotConfigDeExecucao(
    configLocal: LocalBotConfig,
    tarefa: TarefaAgendada
): BotConfig {
     return {
        ...settings,
        login: configLocal.profile.login,
        password: configLocal.profile.password,
        preferredMeal: tarefa.rotuloRefeicaoPreferida,
        preferredDateText: tarefa.textoDataPreferida,
        targetOpenTime: undefined
    };
}

export interface ConfigDeExecucaoEmTempoDeExecucao {
    login: string;
    password: string;
    refeicaoPreferida: string;
    textoDaDataPreferida: string;
}

export function construirConfigDeExecucaoEmTempoDeExecucao(
    config: LocalBotConfig,
    tarefa: TarefaAgendada
): ConfigDeExecucaoEmTempoDeExecucao {
    return {
        login: config.profile.login,
        password: config.profile.password,
        refeicaoPreferida: tarefa.rotuloRefeicaoPreferida,
        textoDaDataPreferida: tarefa.textoDataPreferida
    };
}