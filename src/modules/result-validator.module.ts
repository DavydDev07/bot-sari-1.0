import { Page } from "playwright";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";
import { selectors } from "../utils/selectors";

export class ResultValidatorModule {
    constructor(
        private readonly page: Page,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService
    ) {}

    async validateSuccess(): Promise<void> {
        this.logger.info("Validando resultado da compra...");

        const popup = this.page.locator(selectors.result.activePopup);

        try {
            await popup.waitFor({ timeout: 5000 });
        } catch {
            const shot = await this.screenshotService.save(this.page, "no-popup");
            throw new Error(`Popup de confirmação não apareceu. Screenshot: ${shot}`);
        }

        const text = (await popup.innerText().catch(() => "")).toLowerCase();

        if (text.includes("registrou com sucesso")) {
            this.logger.info("Compra realizada com sucesso.");
            await this.screenshotService.save(this.page, "success");
            return;
        }

        if (text.includes("captcha") || text.includes("verificação expir") || text.includes("verificacao expir")) {
            const shot = await this.screenshotService.save(this.page, "captcha-expired");
            throw new Error(`Captcha expirou antes da compra. Screenshot: ${shot}`);
        }

        if (text.includes("erro") || text.includes("indispon")) {
            const shot = await this.screenshotService.save(this.page, "purchase-error");
            throw new Error(`Erro ao tentar comprar o ticket. Screenshot: ${shot}`);
        }

        const shot = await this.screenshotService.save(this.page, "unknown-result");
        throw new Error(`Resultado desconhecido após tentativa de compra. Screenshot: ${shot}`);
    }
}