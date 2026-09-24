import * as fs from "fs";
import * as path from "path";
import { Page } from "playwright";

export class ScreenshotService {
    constructor(private readonly screenshotsDir: string) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    async save(page: Page, label: string): Promise<string> {
        const safeLabel = label.replace(/[^a-zA-Z0-9-_]/g, "_");
        const fileName = `${new Date().toISOString().replace(/[.:]/g, "-")}-${safeLabel}.png`;
        const fullPath = path.join(this.screenshotsDir, fileName);

        await page.screenshot({
            path: fullPath,
            fullPage: true
        });

        return fullPath;
    }
}