/**
 * AUTO-DISCOVERY WINDOWS BRIDGE (ZERO-DEPENDENCY)
 * Automatically finds the Android Hub on your local network.
 */
const http = require('http');
const { exec } = require('child_process');
const os = require('os');

const PORT = 8927;
let HUB_IP = null;

function getSubnet() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address.split('.').slice(0, 3).join('.');
            }
        }
    }
    return '192.168.1';
}

async function discover() {
    const subnet = getSubnet();
    console.log(`Scanning subnet ${subnet}.x for Android Hub...`);
    
    for (let i = 1; i < 255; i++) {
        const ip = `${subnet}.${i}`;
        const check = (targetIp) => {
            return new Promise((resolve) => {
                const req = http.get(`http://${targetIp}:${PORT}/identify`, { timeout: 200 }, (res) => {
                    let data = '';
                    res.on('data', d => data += d);
                    res.on('end', () => {
                        try {
                            if (JSON.parse(data).service === 'yt-remote-hub') {
                                resolve(targetIp);
                            } else resolve(null);
                        } catch (e) { resolve(null); }
                    });
                });
                req.on('error', () => resolve(null));
                req.on('timeout', () => { req.destroy(); resolve(null); });
            });
        };

        const found = await check(ip);
        if (found) {
            HUB_IP = found;
            console.log(`>>> SUCCESS: Found Android Hub at ${HUB_IP}`);
            startPolling();
            return;
        }
    }
    console.log("Hub not found. Retrying scan in 10s...");
    setTimeout(discover, 10000);
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
