import { Page } from "playwright";
import { BotConfig } from "../core/types";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";
import { selectors } from "../utils/selectors";
import { sleep } from "../utils/wait";

export class AuthModule {
    constructor(
        private readonly page: Page,
        private readonly config: BotConfig,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService
    ) {}

    async login(): Promise<void> {
        const loginUrl = "https://www.floriano.ifpi.edu.br:8181/CortexMobileIFPI/login.jsf";
        this.logger.info(`Abrindo login: ${loginUrl}`);

        for (let tentativa = 1; tentativa <= 5; tentativa++) {
            try {
                this.logger.info(`Tentando abrir login (${tentativa}/5)...`);

                await this.page.goto(loginUrl, {
                    waitUntil: "domcontentloaded",
                    timeout: 60000
                });

                break;
            } catch (error) {
                this.logger.warn(`Falha ao abrir login na tentativa ${tentativa}.`);

                if (tentativa === 5) {
                    const shot = await this.screenshotService.save(this.page, "login-page-timeout");
                    throw new Error(
                        `Falha ao abrir a página de login após 5 tentativas. Screenshot: ${shot}`
                    );
                }

                await sleep(10000);
            }
        }

        await this.page.waitForLoadState("networkidle").catch(() => undefined);

        await this.page.locator(selectors.login.usernameInput).first().fill(this.config.login);
        await this.page.locator(selectors.login.passwordInput).first().fill(this.config.password);

        await Promise.all([
            this.page.waitForLoadState("domcontentloaded").catch(() => undefined),
            this.page.locator(selectors.login.submitButton).first().click()
        ]);

        await this.page.waitForLoadState("networkidle").catch(() => undefined);

        const loggedIn =
            (await this.page.locator('text=Administração da Minha Conta').count()) > 0 ||
            (await this.page.locator('text=Solicitar Ticket').count()) > 0;

        if (!loggedIn) {
            const shot = await this.screenshotService.save(this.page, "login-failed");
            throw new Error(`Login não confirmado. Screenshot: ${shot}`);
        }

        this.logger.info("Login realizado com sucesso.");
    }
}