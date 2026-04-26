/**
 * AGGRESSIVE AUTO-DISCOVERY WINDOWS BRIDGE
 * Scans ALL network interfaces to find the Android Hub.
 */
const http = require('http');
const { exec } = require('child_process');
const os = require('os');

const PORT = 8927;
let HUB_IP = null;

function getSubnets() {
    const subnets = [];
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                subnets.push(iface.address.split('.').slice(0, 3).join('.'));
            }
        }
    }
    return [...new Set(subnets)]; // Unique subnets
}

async function discover() {
    const subnets = getSubnets();
    console.log(`Scanning subnets: ${subnets.join(', ')} for Android Hub...`);
    
    const check = (targetIp) => {
        return new Promise((resolve) => {
            const req = http.get(`http://${targetIp}:${PORT}/identify`, { timeout: 300 }, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => {
                    try {
                        if (JSON.parse(data).service === 'yt-remote-hub') resolve(targetIp);
                        else resolve(null);
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
    };

    // Scan all subnets in parallel, checking .1 first
    for (const subnet of subnets) {
        console.log(`Checking subnet: ${subnet}.x`);
        
        // Strategy: Check .1 first (standard for Hotspots)
        const gatewayIp = `${subnet}.1`;
        const isGateway = await check(gatewayIp);
        if (isGateway) { HUB_IP = isGateway; break; }

        const promises = [];
        for (let i = 2; i < 255; i++) {
            promises.push(check(`${subnet}.${i}`));
            // Batch the pings to avoid overwhelming the network
            if (promises.length > 50) {
                const results = await Promise.all(promises);
                const found = results.find(r => r !== null);
                if (found) { HUB_IP = found; break; }
                promises.length = 0;
            }
        }
        if (HUB_IP) break;
    }

    if (HUB_IP) {
        console.log(`>>> SUCCESS: Found Android Hub at ${HUB_IP}`);
        startPolling();
    } else {
        console.log("Hub not found on any network. Retrying in 10s...");
        setTimeout(discover, 10000);
    }
}

function startPolling() {
    http.get(`http://${HUB_IP}:${PORT}/bridge-poll`, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            try {
                const cmd = JSON.parse(data);
                if (cmd && cmd.type) handleCommand(cmd);
            } catch (e) {}
            setTimeout(startPolling, 800);
        });
    }).on('error', () => {
        console.log("Connection lost. Re-scanning...");
        discover();
    });
}

function handleCommand(cmd) {
    console.log('Action:', cmd.type);
    if (cmd.type === 'toggle-bt') {
        exec(`powershell -Command "Get-NetAdapter | Where-Object { $_.Name -like '*Bluetooth*' } | ForEach-Object { if ($_.Status -eq 'Up') { Disable-NetAdapter -Name $_.Name -Confirm:$false } else { Enable-NetAdapter -Name $_.Name -Confirm:$false } }"`);
    } else if (cmd.type === 'set-system-volume') {
        exec(`powershell -Command "$obj = new-object -com wscript.shell; for($i=0; $i<10; $i++) { $obj.SendKeys([char]174) }; for($i=0; $i<${Math.floor(cmd.volume/10)}; $i++) { $obj.SendKeys([char]175) }"`);
    }
}

discover();
