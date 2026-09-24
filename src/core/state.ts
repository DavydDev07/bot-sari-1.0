export type BotState =
    | "IDLE"
    | "BOOTING"
    | "LOGGING_IN"
    | "NAVIGATING"
    | "WAITING_TICKETS"
    | "WAITING_CAPTCHA"
    | "READY_TO_PURCHASE"
    | "PURCHASING"
    | "SUCCESS"
    | "FAILED";