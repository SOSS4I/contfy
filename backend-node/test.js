// Test Node backend
const https = require('http');

const data = JSON.stringify({
  name: 'Teste Node Backend',
  email: 'teste.node@example.com',
  cnpj: '12.345.678/0001-99',
  phone: '11999999999',
  tax_regime: 'SIMPLES_NACIONAL',
  status: 'ativo'
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/clientes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
