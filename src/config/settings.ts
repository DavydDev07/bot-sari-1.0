import { env } from "./env";
import { BotConfig } from "../core/types";

export const settings: BotConfig = {
    baseUrl: env.SARI_BASE_URL,
    loginUrl: env.SARI_LOGIN_URL,
    ticketUrl: env.SARI_TICKET_URL,

    login: env.SARI_LOGIN,
    password: env.SARI_PASSWORD,

    headless: env.HEADLESS,
    slowMoMs: env.SLOW_MO_MS,
    defaultTimeoutMs: env.DEFAULT_TIMEOUT_MS,
    monitorIntervalMs: env.MONITOR_INTERVAL_MS,
    manualCaptchaTimeoutMs: env.MANUAL_CAPTCHA_TIMEOUT_MS,

    preferredMeal: env.PREFERRED_MEAL || undefined,
    preferredDateText: env.PREFERRED_DATE_TEXT || undefined,
    targetOpenTime: env.TARGET_OPEN_TIME || undefined,

    logsDir: "./logs",
    screenshotsDir: "./screenshots"
};