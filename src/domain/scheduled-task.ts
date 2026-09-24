import { TipoRefeicao, DiaDaSemana } from "./schedule";

export type StatusTarefa = 
    | "pendente"
    | "em execução"
    | "sucesso"
    | "falhou"
    | "expirado";

export interface TarefaAgendada {
    id: string;
    refeicao: TipoRefeicao;
    diaDaSemana: DiaDaSemana;
    ticketDate: string; // dd/mm/aaaa
    executarEm: string; // string ISO
    expiraEm: string; // string ISO
    rotuloRefeicaoPreferida: string; // "Almoço" | "Jantar"
    textoDataPreferida: string; // dd/mm/aaaa
    status: StatusTarefa;
}