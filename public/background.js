

console.log('background script loaded')

browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'toggle-emoji':
            console.log('toggle-emoji message received : ', message.emoji_active)
            browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
                // TODO: Add a persistent storage to store the disabled domains
                console.log("%cTODO: Add a persistent storage to store the disabled domains - ", tabs[0].url, 'color: #bbfa1a');
                browser.tabs.sendMessage(tabs[0].id, message.emoji_active ? "emoji-enabled" : "emoji-disabled");
                browser.notifications.create({
                    "type": "basic",
                    "iconUrl": browser.extension.getURL("icons/emoji-48.png"),
                    "title": "Emoji preferences - ",
                    "message": (message.emoji_active ? "Emoji enabled" : "Emoji disabled") + `for ${tabs[0].domain}`
                })
            });
            break;

        default:
            console.error('Unknown message type received : ', message.type);
    }
});
