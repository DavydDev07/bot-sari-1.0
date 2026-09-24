import { TipoRefeicao } from "./schedule";

export interface ItemHistoricoRefeicao {
    idTarefa: string;
    iniciandoEm: string;
    finalizandoEm?: string;
    refeicao: TipoRefeicao;
    dataDoTicket: string;
    resultado: "sucesso" | "falha" | "expirado";
    mensagem?: string;
    screenshotPath: string;
}