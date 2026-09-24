import { BotConfig } from "./types";
import { BotState } from "./state";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";
import { BrowserManager } from "../infra/browser.manager";
import { AuthModule } from "../modules/auth.module";
import { NavigationModule } from "../modules/navigation.module";
import { TicketMonitorModule } from "../modules/ticket.monitor.module";
import { CaptchaGateModule } from "../modules/captcha-gate.module";
import { PurchaseExecutorModule } from "../modules/purchase-exercutor.module";
import { ResultValidatorModule } from "../modules/result-validator.module";

export class Orchestrator {
    private state: BotState = "IDLE";

    constructor(
        private readonly config: BotConfig,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService,
        private readonly browserManager: BrowserManager
    ) {}

    private setState(state: BotState): void {
        this.state = state;
        this.logger.info(`Estado -> ${state}`);
    }

    private async waitUntilTargetTime(): Promise<void> {
        if (!this.config.targetOpenTime) return;

        const [hourStr, minuteStr] = this.config.targetOpenTime.split(":");
        const hour = Number(hourStr);
        const minute = Number(minuteStr);

        if (Number.isNaN(hour) || Number.isNaN(minute)) {
            throw new Error("TARGET_OPEN_TIME inválido. Use HH:MM");
        }

        const now = new Date();
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);

        if (target <= now) {
            this.logger.warn(`TARGET_OPEN_TIME ${this.config.targetOpenTime} já passou. Continuando agora.`);
            return;
        }

        const diffMs = target.getTime() - now.getTime();
        this.logger.info(`Aguardando até ${this.config.targetOpenTime}. Faltam ${Math.ceil(diffMs / 1000)}s.`);
        await new Promise((resolve) => setTimeout(resolve, diffMs));
    }

    async run(): Promise<void> {
        this.setState("BOOTING");
        await this.browserManager.start();

        const page = this.browserManager.getPage();

        const authModule = new AuthModule(page, this.config, this.logger, this.screenshotService);
        const navigationModule = new NavigationModule(page, this.config, this.logger, this.screenshotService);
        const ticketMonitorModule = new TicketMonitorModule(page, this.config, this.logger, this.screenshotService);
        const captchaGateModule = new CaptchaGateModule(page, this.config, this.logger, this.screenshotService);
        const purchaseExecutorModule = new PurchaseExecutorModule(page, this.logger);
        const resultValidatorModule = new ResultValidatorModule(page, this.logger, this.screenshotService);

        try {
              this.setState("LOGGING_IN");
              await authModule.login();

            this.setState("NAVIGATING");
            await navigationModule.goToTicketPage();

            await this.waitUntilTargetTime();

            this.setState("WAITING_TICKETS");
            const monitorResult = await ticketMonitorModule.waitForDesiredTicketResult();

            if (monitorResult.status !== "ENCONTRADO" || !monitorResult.ticket) {
                throw new Error(
                    `Monitor de tickets: ${monitorResult.status} - ${monitorResult.message}`
                );
            }

            const ticket = monitorResult.ticket;

            this.setState("WAITING_CAPTCHA");
            await captchaGateModule.waitForCaptchaSolved();

            this.setState("READY_TO_PURCHASE");
            this.setState("PURCHASING");
            await purchaseExecutorModule.purchase(ticket);

            await resultValidatorModule.validateSuccess();

            this.setState("SUCCESS");
            this.logger.info("Execução concluída com sucesso.");
    } catch (error) {
        this.setState("FAILED");

        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Falha no fluxo: ${message}`);

        const shot = await this.screenshotService.save(page, "fatal-error").catch(() => "");
        if (shot) {
         this.logger.error(`Screenshot final: ${shot}`);
        }

        throw error;
} finally {
    await this.browserManager.stop();
    }
}
}