import { UserCategory } from "./user-profile";
import { TipoRefeicao, DiaDaSemana } from "./schedule";

export interface JanelaDeCompra {
    refeicao: TipoRefeicao;
    dataTicket: string; // dd/mm/yyyy
    abriEm: Date;
    fechaEm: Date;
    rotuloRefeicaoPreferida: string // "almoço" | "Jantar"
    textoDataPreferida: string; // dd/mm/yyyy
}

const INDEX_DIADASEMANA: Record<DiaDaSemana, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6
}

export function temPrioridadeDeAlmoco(category: UserCategory): boolean {
    return category === "aluno_manha_tarde";
}

export function temPrioridadeParaJantar(category: UserCategory): boolean {
    return category === "aluno_noite";
}

export function obterTicketDeRefeicao(refeicao: TipoRefeicao): string {
    return refeicao === "almoco" ? "Almoço" : "Jantar";
}

export function horarioDeInicioDaRefeicao(refeicao: TipoRefeicao): string {
    return refeicao === "almoco" ? "12:00" : "17:30";
}

export function horarioFinalDaRefeicao(refeicao: TipoRefeicao): string {
    return refeicao === "almoco" ? "13:30" : "18:30";
}

export function horarioDeFechamentoDaCompra(refeicao: TipoRefeicao): string {
    // 1h30 antes do inicio da refeição
    return refeicao === "almoco" ? "10:30" : "16:00";
}

export function obterHorarioDeAbertura(category: UserCategory, refeicao: TipoRefeicao): string {
    if (refeicao === "almoco"){
        return temPrioridadeDeAlmoco(category) ? "21:00" : "22:00";
    }

    return temPrioridadeParaJantar(category) ? "11:00" : "12:00";
}

export function formatoDataBR(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function cloneData(date: Date): Date {
    return new Date(date.getTime())
}

export function definirHorario(date: Date, timeHHMM: string): Date {
    const [horaStr, minutoStr] = timeHHMM.split(":");
    const hora = Number(horaStr);
    const minuto = Number(minutoStr);

    if(Number.isNaN(hora) || Number.isNaN(minuto)){
        throw new Error(`Horário Invalido:  ${timeHHMM}`);
    }

    const copy = cloneData(date);
    copy.setHours(hora, minuto, 0, 0);
    return copy;
}

export function adicionarDias(date: Date, days: number): Date {
    const copy = cloneData(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function obterProximaDataSemanal(baseDate: Date, diaDaSemana: DiaDaSemana): Date {
    const current = baseDate.getDay();
    const target = INDEX_DIADASEMANA[diaDaSemana];

    const diff = (target - current + 7) % 7;
    return adicionarDias(baseDate, diff);
}

export function calcularJanelaDeCompra(
    category: UserCategory,
    refeicao: TipoRefeicao,
    ticketDia: Date
): JanelaDeCompra {
    const rotuloRefeicaoPreferida = obterTicketDeRefeicao(refeicao);
    const textoDataPreferida = formatoDataBR(ticketDia);

    let abriEm: Date;
    let fechaEm: Date;

    if(refeicao === "almoco"){
        const aberturaBaseDate = adicionarDias(ticketDia, -1);
        abriEm = definirHorario(aberturaBaseDate, obterHorarioDeAbertura(category, refeicao));
        fechaEm = definirHorario(ticketDia, horarioDeFechamentoDaCompra(refeicao));
    }else {
        abriEm = definirHorario(ticketDia,obterHorarioDeAbertura(category, refeicao));
        fechaEm = definirHorario(ticketDia, horarioDeFechamentoDaCompra(refeicao));
    }

    return {
        refeicao,
        dataTicket: textoDataPreferida,
        abriEm,
        fechaEm,
        rotuloRefeicaoPreferida,
        textoDataPreferida
    };
}

export function aJanelaExpirou(window: JanelaDeCompra, now = new Date()): boolean {
    return now >= window.fechaEm;
}

export function podeExecutarAgora(window: JanelaDeCompra, now = new Date()): boolean {
    return now >= window.abriEm && now < window.fechaEm;
}

export function obterDiaDaSemanaAPartirDaData(date: Date): DiaDaSemana {
    const map: Record<number, DiaDaSemana> = {
        0: "domingo",
        1: "segunda",
        2: "terca",
        3: "quarta",
        4: "quinta",
        5: "sexta",
        6: "sabado"
    };

    return map[date.getDay()];
}

