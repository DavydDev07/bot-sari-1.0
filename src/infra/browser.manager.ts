import { Browser, BrowserContext, Page } from "playwright";
import { BotConfig } from "../core/types";
import { Logger } from "./logger";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

export class BrowserManager {
    private browser!: Browser;
    private context!: BrowserContext;
    private page!: Page;

    constructor(
        private readonly config: BotConfig,
        private readonly logger: Logger
    ) {}

    async start(): Promise<void> {
        
    const isHeadless = this.config.headless;
    
    this.logger.info(`Iniciando navegador. headless=${isHeadless}`);

    this.browser = await chromium.launch({
        headless: isHeadless, // Agora usa a variável tratada
        args: [
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--hide-scrollbars", // Ajuda a ocultar vestígios
            "--mute-audio"       // Garante que a IA processa o áudio sem o ouvires
        ]
    });

        // 3. Contexto com Proxy (Opcional reforçar aqui)
        this.context = await this.browser.newContext({
            viewport: { width: 1366, height: 768 },
            ignoreHTTPSErrors: true,
            //proxy: proxyConfig, // Garante que o contexto segue o proxy
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });

        this.page = await this.context.newPage();

        // Enganar o sensor de WebDriver mesmo em modo headless
        await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
       this.page.setDefaultTimeout(this.config.defaultTimeoutMs);
    }

    getPage(): Page {
        return this.page;
    }

    async stop(): Promise<void> {
        if (this.context) await this.context.close().catch(() => undefined);
        if (this.browser) await this.browser.close().catch(() => undefined);
        this.logger.info("Navegador encerrado.");
    }
}
