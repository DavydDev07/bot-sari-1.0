import { Locator } from "playwright";

export interface BotConfig {
    baseUrl: string;
    loginUrl: string;
    ticketUrl: string;

    login: string;
    password: string;

    headless: boolean;
    slowMoMs: number;
    defaultTimeoutMs: number;
    monitorIntervalMs: number;
    manualCaptchaTimeoutMs: number;

    preferredMeal?: string;
    preferredDateText?: string;
    targetOpenTime?: string;

    logsDir: string;
    screenshotsDir: string;
}

export interface TicketCandidate {
    rowIndex: number;
    rowText: string;
    button: Locator;
    mealType?: string;
    dateText?: string;
    availableQty: number;
    boughtQty: number;
}

export type TicketMonitorStatus = 
    | "ENCONTRADO"
    | "SEM_CARD_PARA_DATA"
    | "CARD_EXISTE_MAS_INDISPONIVEL"
    | "TIMEOUT_MONITORAMENTO"
    | "ERRO_ESTRUTURAL"

export interface TicketMonitorResult {
    status: TicketMonitorStatus;
    ticket?: TicketCandidate;
    message: string;
    screenshotPath?: string;
    meta?: {
        desiredDate: string | null;
        desiredMeal: string | null;
    };
}
