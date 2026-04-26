const { io } = require('socket.io-client');
const { exec } = require('child_process');

// Replace with your Pixel 3XL's IP address
const HUB_IP = 'PHONE_IP_HERE'; 
const socket = io(`http://${HUB_IP}:8927`, { query: { type: 'bridge' } });

console.log('Windows System Bridge starting...');

socket.on('connect', () => {
  console.log('Connected to Pixel 3XL Hub');
});

socket.on('system-command', (cmd) => {
  console.log('Received system command:', cmd);

  switch (cmd.type) {
    case 'toggle-bt':
      // PowerShell command to toggle Bluetooth
      const psCommand = `
        $radio = Get-NetAdapter | Where-Object { $_.Name -like "*Bluetooth*" };
        if ($radio.Status -eq "Up") {
          Disable-NetAdapter -Name $radio.Name -Confirm:$false
          echo "Bluetooth Disabled"
        } else {
          Enable-NetAdapter -Name $radio.Name -Confirm:$false
          echo "Bluetooth Enabled"
        }
      `;
      // Alternative using modern Windows Bluetooth APIs (requires a helper or specific CLI)
      // For now, let's use a simpler toggle if available or NirCmd
      exec(`powershell -Command "${psCommand.replace(/\n/g, '')}"`, (err, stdout) => {
        console.log(stdout || err);
      });
      break;

    case 'set-system-volume':
      // Using nircmd (popular Windows utility) or PowerShell
      // PowerShell: (new-object -com wscript.shell).SendKeys([char]175) is for volume up
      // Better way: use a small NirCmd command if user has it, or a generic PS script
      const vol = Math.floor(cmd.volume * 655.35); // Scale 0-100 to 0-65535
      exec(`powershell -Command "$obj = new-object -com wscript.shell; for($i=0; $i<50; $i++) { $obj.SendKeys([char]174) }; for($i=0; $i<${Math.floor(cmd.volume/2)}; $i++) { $obj.SendKeys([char]175) }"`);
      break;
  }
});
