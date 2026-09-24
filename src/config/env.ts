import * as dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Variável obrigatória ausente no .env: ${name}`);
    }
    return value.trim();
}

function optional(name: string, fallback = ""): string {
    return (process.env[name] || fallback).trim();
}

function optionalNumber(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
    const raw = process.env[name];
    if (!raw) return fallback;
    return raw.toLowerCase() === "true";
}

export const env = {
    SARI_LOGIN: required("SARI_LOGIN"),
    SARI_PASSWORD: required("SARI_PASSWORD"),
    SARI_BASE_URL: required("SARI_BASE_URL"),
    SARI_LOGIN_URL: required("SARI_LOGIN_URL"),
    SARI_TICKET_URL: required("SARI_TICKET_URL"),

    HEADLESS: optionalBoolean("HEADLESS", true),
    SLOW_MO_MS: optionalNumber("SLOW_MO_MS", 0),
    DEFAULT_TIMEOUT_MS: optionalNumber("DEFAULT_TIMEOUT_MS", 15000),
    MONITOR_INTERVAL_MS: optionalNumber("MONITOR_INTERVAL_MS", 300),
    MANUAL_CAPTCHA_TIMEOUT_MS: optionalNumber("MANUAL_CAPTCHA_TIMEOUT_MS", 120000),

    TARGET_OPEN_TIME: optional("TARGET_OPEN_TIME"),
    PREFERRED_MEAL: optional("PREFERRED_MEAL"),
    PREFERRED_DATE_TEXT: optional("PREFERRED_DATE_TEXT")
};