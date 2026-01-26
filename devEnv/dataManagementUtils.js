// JavaScript
(function(){
    function parseStorageKey(key) {
        if (key == null) return null;
        const segments = [];
        const re = /([^\.\[\]]+)|\[(?:'([^']*)'|"([^"]*)"|([^\]]+))\]/g;
        let m;
        while ((m = re.exec(key)) !== null) {
            if (m[1] !== undefined) segments.push(m[1]);
            else if (m[2] !== undefined) segments.push(m[2]);
            else if (m[3] !== undefined) segments.push(m[3]);
            else if (m[4] !== undefined) segments.push(m[4]);
        }
        return segments;
    }

    window.readData = async function(key) {
        try {
            const pk = parseStorageKey(key);
            if (pk == null) {
                // read everything
                return await browser.storage.sync.get(null);
            }
            const top = pk[0];
            const res = await browser.storage.sync.get(top);
            let cur = res[top];
            for (let i = 1; i < pk.length; i++) {
                if (cur === undefined) {
                    console.error(`Erreur lecture ${key}: segment "${pk[i-1]}" introuvable`);
                    return undefined;
                }
                cur = cur[pk[i]];
            }
            return cur;
        } catch (err) {
            console.error("readData error:", err);
            return undefined;
        }
    }

    window.writeData = async function(key, value) {
        try {
            const pk = parseStorageKey(key);
            if (pk == null) {
                // set entire storage (expects an object) or clear if undefined
                if (value === undefined) {
                    await browser.storage.sync.clear();
                    return true;
                }
                await browser.storage.sync.set(value);
                return true;
            }

            const top = pk[0];
            if (pk.length === 1) {
                if (value === undefined) {
                    await browser.storage.sync.remove(top);
                    return true;
                }
                await browser.storage.sync.set({ [top]: value });
                return true;
            }

            // nested property
            const got = await browser.storage.sync.get(top);
            let root = got[top];
            if (root === undefined || root === null) root = {};
            let cur = root;
            for (let i = 1; i < pk.length - 1; i++) {
                const seg = pk[i];
                if (cur[seg] === undefined || cur[seg] === null) cur[seg] = {};
                cur = cur[seg];
            }
            const last = pk[pk.length - 1];
            if (value === undefined) {
                delete cur[last];
            } else {
                cur[last] = value;
            }
            await browser.storage.sync.set({ [top]: root });
            return true;
        } catch (err) {
            console.error("writeData error:", err);
            return false;
        }
    }
})();
