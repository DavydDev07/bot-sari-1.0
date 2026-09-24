import { BotConfig } from "../core/types";
import { Logger } from "../infra/logger";
import { BrowserManager } from "../infra/browser.manager";
import { Orchestrator } from "../core/orchestrator";
import { ScreenshotService } from "../infra/screenshot.service";

export async function runBot(config: BotConfig): Promise<void> {
    const logger = new Logger(config.logsDir);
    const screenshotService = new ScreenshotService(config.screenshotsDir);
    const browserManager = new BrowserManager(config, logger);

    const orchestrator = new Orchestrator(
        config,
        logger,
        screenshotService,
        browserManager
    );

    await orchestrator.run();
}