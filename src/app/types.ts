export type ApplicationMessage = {
    recipient: "BACKGROUND" | "EMOJI_CONTENT_SCRIPT" | "QUICK_SETTINGS" | "EMOJI_APP",
    type: "SETTINGS_CHANGED" | "APP_COMMUNICATION",
    action: "TOGGLE_ENABLED" |
        "TOGGLE_DISABLED" |
        "ADD_SITE_TO_BLOCK_LIST" |
        "REMOVE_SITE_FROM_BLOCK_LIST" |
        "SEND_MESSAGE" |
        "RECEIVE_MESSAGE" |
        undefined,
    payload: any
}