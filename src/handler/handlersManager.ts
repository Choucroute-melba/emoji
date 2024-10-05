export type HandlerManifest = {
    name: string;
    sites: string[];
    targets: string[];
    uri: string | undefined;
    file: string | undefined;
}

let availableHandlers: {
    time: number;
    handlers: HandlerManifest[];
}

export async function getAvailableHandlers(listUrl: string = "https://raw.githubusercontent.com/Choucroute-melba/emoji/master/dist/handlers.json"): Promise<HandlerManifest[]> {
    if(availableHandlers && availableHandlers.handlers && availableHandlers.handlers.length > 0) {
        return availableHandlers.handlers
    }
    return Promise.resolve(JSON.parse(
        "[\n" +
        "  {\n" +
        "    \"name\": \"AriaDiv\",\n" +
        "    \"sites\": [\"*\"],\n" +
        "    \"targets\": [\"div\"],\n" +
        "    \"uri\": \"https://raw.githubusercontent.com/Choucroute-melba/emoji/master/src/features/aria/handler.ts\",\n" +
        "    \"file\": \"src/features/aria/handler.ts\"\n" +
        "  },\n" +
        "  {\n" +
        "    \"name\": \"TextArea\",\n" +
        "    \"sites\": [\"*\"],\n" +
        "    \"targets\": [\"textarea\"],\n" +
        "    \"uri\": \"https://raw.githubusercontent.com/Choucroute-melba/emoji/master/src/features/textarea/handler.ts\",\n" +
        "    \"file\": \"src/features/textarea/handler.ts\"\n" +
        "  },\n" +
        "  {\n" +
        "    \"name\": \"HTMLInput\",\n" +
        "    \"sites\": [\"*\"],\n" +
        "    \"targets\": [\"input\"],\n" +
        "    \"uri\": \"https://raw.githubusercontent.com/Choucroute-melba/emoji/master/src/features/input/handler.ts\",\n" +
        "    \"file\": \"src/features/input/handler.ts\"\n" +
        "  }\n" +
        "]"
    ))
}

export async function loadHandler(handler: HandlerManifest): Promise<string> {
    if(handler.uri) {
        return fetch(handler.uri).then(response => response.text())
    }
    else
        throw new Error("can't retrieve handler : no uri provided")
}