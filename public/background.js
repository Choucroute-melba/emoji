

console.log('background script loaded')
let msgPorts = []

browser.runtime.onConnect.addListener((port) => {
    console.log(`tab ${port.sender?.tab?.id} connected - ${port.name} - ${port.sender?.url}`)
    let tabIndex = msgPorts.find((p) => p.sender?.tab?.id === port.sender?.tab?.id)
    if(tabIndex !== undefined) {
        console.warn(`tab ${port.sender?.tab?.id} already connected - ${port.name} - ${port.sender?.url}`)
        msgPorts[tabIndex] = port
    }
    else msgPorts.push(port)
})

browser.runtime.onMessage.addListener((message) => {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        const tab = tabs[0]
        switch (message.type) {
            case 'toggle-emoji':
                console.log('toggle-emoji message received : ', message.emoji_active, `from tab: ${tab.id} - ${tab.url}`);
                // TODO: Add a persistent storage to store the disabled domains
                console.log(`%cTODO: Add a persistent storage to store the disabled domains - ${tab.url}`, 'color: #bbfa1a');
                let toggleType = message.emoji_active ? "TOGGLE_ENABLED" : "TOGGLE_DISABLED";
                publishMessage({
                    type: "SETTINGS_CHANGED",
                    action: toggleType,
                    payload: {emoji_active: message.emoji_active},
                });
                browser.notifications.create({
                    "type": "basic",
                    "iconUrl": browser.extension.getURL("icons/emoji-48.png"),
                    "title": "Emoji preferences - ",
                    "message": (message.emoji_active ? "Emoji enabled" : "Emoji disabled") + ` for ${new URL(tab.url).hostname}`
                })
                break;

            default:
                console.error('Unknown message type received : ', message.type);
        }
    });
});

/**
 * Removes the port associated with a tab when it is closed
 */
browser.tabs.onRemoved.addListener((tabId) => {
    let tabIndex = msgPorts.findIndex((p) => p.sender?.tab?.id === tabId)
    if(tabIndex !== undefined) {
        console.log(msgPorts[tabIndex])
        console.info(`tab ${tabId} disconnected - ${msgPorts[tabIndex]}`)
        msgPorts.splice(tabIndex, 1)
        console.log(msgPorts)
    }
});

/**
 * Publishes a message to all the connected tabs and all background scripts by default
 * @param message
 * @param tabId - if provided, the message is only sent to the tab with the given id
 * @param sendToRuntime - if false, the message is not sent to background scripts
 */
function publishMessage(message, tabId = undefined, sendToRuntime = true) {
    if(tabId === undefined) {
        msgPorts.forEach((port) => {
            console.log(`sending message to port (tab ${port.sender.tab.id}) : `, port)
            port.postMessage(message)
        })
    } else {
        msgPorts.forEach((port) => {
            if(port.sender?.tab?.id === tabId) {
                port.postMessage(message)
            }
        })
    }
    if(sendToRuntime) {
        browser.runtime.sendMessage(message)
    }
}
