import { Page } from "playwright";
import {
    BotConfig,
    TicketCandidate,
    TicketMonitorResult
} from "../core/types";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";
import {
    extractAvailableQty,
    extractBoughtQty,
    extractDate,
    extractMealType
} from "../utils/parsers";
import { selectors } from "../utils/selectors";
import { sleep } from "../utils/wait";

export class TicketMonitorModule {
    constructor(
        private readonly page: Page,
        private readonly config: BotConfig,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService
    ) {}

    private scoreTicket(ticket: TicketCandidate): number {
        let score = 0;

        if (ticket.availableQty > 0) score += 10;
        if (ticket.boughtQty === 0) score += 20;

        if (this.config.preferredMeal && ticket.mealType) {
            if (ticket.mealType.toLowerCase() === this.config.preferredMeal.toLowerCase()) {
                score += 100;
            }
        }

        if (this.config.preferredDateText && ticket.dateText) {
            if (ticket.dateText === this.config.preferredDateText) {
                score += 1000;
            }
        }

        return score;
    }

    private chooseBestTicket(candidates: TicketCandidate[]): TicketCandidate | null {
        if (candidates.length === 0) return null;
        return [...candidates].sort((a, b) => this.scoreTicket(b) - this.scoreTicket(a))[0];
    }

    private matchesTarget(card: TicketCandidate): boolean {
        const mealOk =
            !this.config.preferredMeal ||
            (card.mealType &&
                card.mealType.toLowerCase() === this.config.preferredMeal.toLowerCase());

        const dateOk =
            !this.config.preferredDateText ||
            (card.dateText && card.dateText === this.config.preferredDateText);

        return Boolean(mealOk && dateOk);
    }

    async findAllTicketCards(): Promise<TicketCandidate[]> {
        const cards = this.page.locator(selectors.tickets.card);
        const count = await cards.count();
        const found: TicketCandidate[] = [];

        for (let i = 0; i < count; i += 1) {
            const card = cards.nth(i);
            const rowText = (await card.innerText().catch(() => "")).trim();

            if (!rowText || !rowText.includes("Qtd. Disponível")) {
                continue;
            }

            const button = card.locator(selectors.tickets.addButton).first();
            if ((await button.count()) === 0) {
                continue;
            }

            found.push({
                rowIndex: i,
                rowText,
                button,
                mealType: extractMealType(rowText),
                dateText: extractDate(rowText),
                availableQty: extractAvailableQty(rowText),
                boughtQty: extractBoughtQty(rowText)
            });
        }

        return found;
    }

    async waitForDesiredTicketResult(): Promise<TicketMonitorResult> {
        this.logger.info("Procurando tickets disponíveis...");

        const startedAt = Date.now();
        const timeoutMs = 60_000;

        while (true) {
            const allCards = await this.findAllTicketCards();

            if (allCards.length === 0) {
                const shot = await this.screenshotService.save(this.page, "ticket-estrutura-vazia");
                return {
                    status: "ERRO_ESTRUTURAL",
                    message: "Nenhum card de ticket foi encontrado na página.",
                    screenshotPath: shot
                };
            }

            const targetCards = allCards.filter((card) => this.matchesTarget(card));

            const elegiveis = targetCards.filter(
                (card) => card.availableQty > 0 && card.boughtQty === 0
            );

            const ticket = this.chooseBestTicket(elegiveis);

            if (ticket) {
                this.logger.info(
                    `Ticket alvo encontrado. date=${ticket.dateText ?? "-"} meal=${ticket.mealType ?? "-"} available=${ticket.availableQty} bought=${ticket.boughtQty} row="${ticket.rowText.replace(/\s+/g, " ").trim()}"`
                );

                return {
                    status: "ENCONTRADO",
                    ticket,
                    message: "Ticket alvo encontrado com sucesso."
                };
            }

            if (Date.now() - startedAt > timeoutMs) {
                if (targetCards.length === 0) {
                    const shot = await this.screenshotService.save(this.page, "sem-card-para-data");
                    return {
                        status: "SEM_CARD_PARA_DATA",
                        message: "Não existe card para a data/refeição desejada nesta tela.",
                        screenshotPath: shot
                    };
                }

                const indisponiveis = targetCards.filter(
                    (card) => card.availableQty <= 0 || card.boughtQty > 0
                );

                if (indisponiveis.length > 0) {
                    const shot = await this.screenshotService.save(this.page, "ticket-indisponivel");
                    return {
                        status: "CARD_EXISTE_MAS_INDISPONIVEL",
                        message: "Existe card para a data/refeição desejada, mas ele não está elegível para compra.",
                        screenshotPath: shot
                    };
                }

                const shot = await this.screenshotService.save(this.page, "ticket-timeout");
                return {
                    status: "TIMEOUT_MONITORAMENTO",
                    message: "Tempo limite atingido durante o monitoramento do ticket.",
                    screenshotPath: shot
                };
            }

            await this.page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
            await this.page.waitForLoadState("networkidle").catch(() => undefined);
            await sleep(this.config.monitorIntervalMs);
        }
    }
}