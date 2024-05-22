import express from 'express';
import getMAC from 'getmac';
import os from 'os';
import { first, all } from 'macaddress-local-machine';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
const si = require('systeminformation');
const app = express();
const port = 3000;

function getIpAddress() {
  const ifaces = os.networkInterfaces();
  for (const iface in ifaces) {
    const addresses = ifaces[iface];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return 'Unknown';
}


const getServerIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  let ipv4Address = '';

  for (const iface in networkInterfaces) {
    const addresses = networkInterfaces[iface];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        ipv4Address = address.address;
        break;
      }
    }
    if (ipv4Address) break;
  }

  return ipv4Address || 'localhost';
};


app.get('/network', async (req, res) => {
  try {

    const macAddress = getMAC();
    const serialNumber = machineIdSync({ original: true });
    const networkInterfaces = await si.networkInterfaces();
    const wifiConnections = await si.wifiConnections();
    const graphics = await si.graphics();
    const userIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const cpuSerial = machineIdSync(); 
    res.json({
      cpuSerial,
      userIp,
      userAgent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// مسار للحصول على عنوان MAC
app.get('/mac', async (req, res) => {
  try {
    const macAddress = first();
    const macAddresses = all();
    const ipAddress = getServerIpAddress();
    const serialNumber = machineIdSync({ original: true });
    const userIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const networkInterfaces = await si.networkInterfaces();

    res.json({
      mac_network: getMAC(),
      serialNumber,
      ipAddress,
      userIp,
      userAgent,
      networkInterfaces,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/add', (req, res) => {
  getMAC((err, macAddress) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching MAC address', details: err });
    }
    const userIp = req.ip;
    const userAgent = req.headers['user-agent'];
    res.json({ macAddress, userIp, userAgent });
  });
});

// بدء الخادم
const server = app.listen(port, () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = networkInterfaces['en0'] || networkInterfaces['eth0'] || [];
  const ipv4Address = addresses.find(address => address.family === 'IPv4');

  if (ipv4Address) {
    console.log(`Server running at http://${ipv4Address.address}:${port}`);
  } else {
    console.log(`Server running at http://localhost:${port}`);
  }
});

export default server;
