export type TipoRefeicao = "almoco" | "jantar";

export type DiaDaSemana = 
    | "segunda"
    | "terca"
    | "quarta"
    | "quinta"
    | "sexta"
    | "sabado"
    | "domingo";

export interface HorarioRefeicao{
    habilitada: boolean;
    dias: DiaDaSemana[];
}

export interface PoliticaDeRefeicao {
    ativado: boolean;
    maxDeTentativas: number;
    tempDeEsperaEntreTentativas: number;
}

export interface LocalBotConfig {
    profile: {
        category: import("./user-profile").UserCategory;
    };

    almoco: HorarioRefeicao;
    jantar: HorarioRefeicao;

    politicaDeRepeticao: PoliticaDeRefeicao;

    salvarCapturasDeTelaEmCasoDeErro: boolean;
    salvarLogs: boolean;
}