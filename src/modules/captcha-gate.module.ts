import { Page } from "playwright";
import { BotConfig } from "../core/types";
import { Logger } from "../infra/logger";
import { ScreenshotService } from "../infra/screenshot.service";
import { selectors } from "../utils/selectors";
import { sleep } from "../utils/wait";
import { spawn } from "child_process";

export class CaptchaGateModule {
    private readonly MAX_RETRIES = 3;

    constructor(
        private readonly page: Page,
        private readonly config: BotConfig,
        private readonly logger: Logger,
        private readonly screenshotService: ScreenshotService
    ) {}

    // Substitui execSync por chamada assíncrona — não bloqueia a thread
    private transcribeAudio(audioUrl: string): Promise<string> {
        return new Promise((resolve) => {
            const proc = spawn("python", ["captcha_engine.py", audioUrl]);
            let output = "";
            proc.stdout.on("data", (d) => (output += d.toString()));
            proc.on("close", () => resolve(output.trim()));
            proc.on("error", () => resolve("ERROR"));
            // Timeout de segurança: 30s
            setTimeout(() => { proc.kill(); resolve("ERROR"); }, 30000);
        });
    }

    private async solveAutomatically(): Promise<boolean> {
        this.logger.info("Iniciando resolução automática do reCAPTCHA...");
        try {
            // 1. Clicar no checkbox (frameLocator nativo — sem hacks de DOM)
            const anchorFrame = this.page.frameLocator('iframe[title="reCAPTCHA"]');
            await anchorFrame.locator('#recaptcha-anchor').click();
            await sleep(3000);

            // 2. Clicar no botão de áudio — usando frameLocator corretamente
            // Seletor universal: funciona em qualquer idioma do browser
            const challengeFrame = this.page.frameLocator('iframe[src*="recaptcha/api2/bframe"]');
            
            const audioButton = challengeFrame.locator('#recaptcha-audio-button');
            await audioButton.waitFor({ state: 'visible', timeout: 8000 });
            await audioButton.click();
            await sleep(3000);

            // 3. Capturar URL do áudio
            this.logger.info("Extraindo link do áudio...");
            const audioSource = challengeFrame.locator('#audio-source');
            await audioSource.waitFor({ state: 'attached', timeout: 10000 });
            
            const audioUrl = await audioSource.getAttribute('src');
            if (!audioUrl) throw new Error("URL do áudio não encontrada.");

            // 4. Transcrever de forma assíncrona
            this.logger.info("Transcrevendo áudio...");
            const transcricao = await this.transcribeAudio(audioUrl);

            if (transcricao === "ERROR" || !transcricao) {
                throw new Error("Falha na transcrição do áudio.");
            }
            this.logger.info(`Áudio transcrito: "${transcricao}"`);

            // 5. Preencher e verificar
            await challengeFrame.locator('#audio-response').fill(transcricao);
            await challengeFrame.locator('#recaptcha-verify-button').click();

            return true;
        } catch (error: any) {
            this.logger.error(`Erro na resolução: ${error.message}`);
            return false;
        }
    }

    async isCaptchaSolved(): Promise<boolean> {
        const responseInput = this.page.locator(selectors.captcha.responseField).first();
        if (await responseInput.count() === 0) return false;
        const value = await responseInput.inputValue().catch(() => "");
        return value.trim().length > 0;
    }

    async waitForCaptchaSolved(): Promise<void> {
        this.logger.warn("Iniciando resolução do reCAPTCHA...");

        // Retry automático — até 3 tentativas com pausa crescente
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            this.logger.info(`Tentativa ${attempt}/${this.MAX_RETRIES}...`);
            const solved = await this.solveAutomatically();

            if (!solved){
                //AQUIIIII
                this.logger.warn(`solveAutomatically falhou na tentativa ${attempt}`);
            }
            await sleep(2000);

            if (await this.isCaptchaSolved()) {
                this.logger.info("reCAPTCHA resolvido com sucesso!");
                return;
            }

            if (attempt < this.MAX_RETRIES) {
                this.logger.warn(`Tentativa ${attempt} falhou. Aguardando ${attempt * 2}s...`);
                await sleep(attempt * 2000); // backoff: 2s, 4s
            }
        }

        // Esgotou as tentativas
        const shot = await this.screenshotService.save(this.page, "captcha-timeout");
        throw new Error(`reCAPTCHA não resolvido após ${this.MAX_RETRIES} tentativas. Screenshot: ${shot}`);
    }
}