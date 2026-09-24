import { Page } from "playwright";
import { BotConfig } from "../core/types";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";

export class NavigationModule {
    constructor(
        private readonly page: Page,
        private readonly config: BotConfig,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService
    ) {}

    async goToTicketPage(): Promise<void> {
        this.logger.info("Navegando até a tela de solicitar ticket.");

        const directTicketLink = this.page
            .locator('a[href*="/modulos/minhaConta/solicitarTickets.jsf"]')
            .first();

        if ((await directTicketLink.count()) > 0) {
            this.logger.info("Link direto de Solicitar Ticket encontrado.");
            await directTicketLink.click();
        } else {
            this.logger.info("Link direto não encontrado. Tentando menu intermediário.");

            const accountLink = this.page
                .locator('a[href*="/modulos/minhaConta/minhaConta.jsf"]')
                .first();

            await accountLink.waitFor({ state: "visible", timeout: this.config.defaultTimeoutMs });
            await accountLink.click({ force: true });

            await this.page.waitForLoadState("networkidle").catch(() => undefined);

            const ticketLink = this.page
                .locator('a[href*="/modulos/minhaConta/solicitarTickets.jsf"]')
                .first();

            await ticketLink.waitFor({ state: "visible", timeout: this.config.defaultTimeoutMs });
            await ticketLink.click({ force: true });
        }

        await this.page.waitForURL(/solicitarTickets\.jsf/i, {
            timeout: this.config.defaultTimeoutMs
        }).catch(() => undefined);

        await this.page.waitForLoadState("networkidle").catch(() => undefined);

        if (!this.page.url().includes("solicitarTickets.jsf")) {
            const shot = await this.screenshotService.save(this.page, "navigation-failed");
            throw new Error(`Falha ao acessar solicitarTickets.jsf. Screenshot: ${shot}`);
        }

        this.logger.info("Tela de tickets carregada com sucesso.");
    }
}