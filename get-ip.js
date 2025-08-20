const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  console.log('Available network interfaces:');
  console.log('============================');
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`Interface: ${name}`);
        console.log(`IP Address: ${interface.address}`);
        console.log(`Netmask: ${interface.netmask}`);
        console.log(`---`);
        
        // If it's a 192.168.x.x address, highlight it
        if (interface.address.startsWith('192.168.')) {
          console.log(`✅ Recommended for mobile testing: http://${interface.address}:5000`);
        }
      }
    }
  }
  
  console.log('\nTo test from mobile:');
  console.log('1. Make sure your mobile device is on the same WiFi network');
  console.log('2. Use the IP address above instead of localhost');
  console.log('3. Example: http://192.168.1.14:5000/api');
}

getLocalIP(); 