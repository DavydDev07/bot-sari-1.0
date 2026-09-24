import { LocalBotConfig, TipoRefeicao, DiaDaSemana } from "../domain/schedule";
import { TarefaAgendada } from "../domain/scheduled-task";
import { calcularJanelaDeCompra, formatoDataBR, 
    obterProximaDataSemanal } from "../domain/sari-rules";

function construirTaskId(ticketDate: string, refeicao: TipoRefeicao): string {
    return `${ticketDate}-${refeicao}`.replace(/[\/\s]+/g, "-").toLowerCase();
}

function criarTask(
    config: LocalBotConfig,
    refeicao: TipoRefeicao,
    diaDaSemana: DiaDaSemana,
    dataTicket: Date
): TarefaAgendada {
    const janela = calcularJanelaDeCompra(config.profile.category, refeicao, dataTicket);

    return {
        id: construirTaskId(janela.dataTicket, refeicao),
        refeicao,
        diaDaSemana,
        ticketDate: janela.dataTicket,
        executarEm: janela.abriEm.toISOString(),
        expiraEm: janela.fechaEm.toISOString(),
        rotuloRefeicaoPreferida: janela.rotuloRefeicaoPreferida,
        textoDataPreferida: janela.textoDataPreferida,
        status: "pendente"
    };
}

export function gerarTarefasParaOsProximosDias(
    config: LocalBotConfig,
    dataBase = new Date(),
    diasAFrente = 7
): TarefaAgendada[] {
    const tarefas: TarefaAgendada[] = [];
    const tarefaAdicionadaKeys = new Set<string>();

    const cronogramaDefinicoes: Array<{
        refeicao: TipoRefeicao;
        habilitada: boolean;
        dias: DiaDaSemana[];
    }> = [
        {
            refeicao: "almoco",
            habilitada: config.almoco.habilitada,
            dias: config.almoco.dias
        },
        {
            refeicao: "jantar",
            habilitada: config.jantar.habilitada,
            dias: config.jantar.dias
        }
    ];

    for (const definition of cronogramaDefinicoes) {
        if (!definition.habilitada) continue;

        for (const weekday of definition.dias) {
            const firstDate = obterProximaDataSemanal(dataBase, weekday);

            for (let offset = 0; offset < diasAFrente; offset += 7) {
                const ticketDay = new Date(firstDate.getTime());
                ticketDay.setDate(ticketDay.getDate() + offset);

                const key = `${formatoDataBR(ticketDay)}-${definition.refeicao}`;
                if (tarefaAdicionadaKeys.has(key)) continue;

                tarefaAdicionadaKeys.add(key);
                tarefas.push(criarTask(config, definition.refeicao, weekday, ticketDay));
            }
        }
    }

    return tarefas.sort(
        (a, b) => new Date(a.executarEm).getTime() - new Date(b.executarEm).getTime()
    );
}