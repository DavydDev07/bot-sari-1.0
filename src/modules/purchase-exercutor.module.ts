import { Page } from "playwright";
import { TicketCandidate } from "../core/types";
import { Logger } from "../infra/logger";

export class PurchaseExecutorModule {
    constructor(
        private readonly page: Page,
        private readonly logger: Logger
    ) {}

    async purchase(ticket: TicketCandidate): Promise<void> {
        this.logger.info("Executando clique de compra...");

        const responsePromise = this.page.waitForResponse(
            (response) =>
                response.url().includes("solicitarTickets.jsf") &&
                response.request().method() === "POST",
            { timeout: 15000 }
        ).catch(() => null);

        await ticket.button.click();

        const response = await responsePromise;
        if (response) {
            this.logger.info(`Resposta AJAX capturada: status=${response.status()} url=${response.url()}`);
        } else {
            this.logger.warn("Nenhuma resposta AJAX correspondente foi capturada.");
        }

        await this.page.waitForLoadState("networkidle").catch(() => undefined);
        await this.page.waitForTimeout(800);
    }
}