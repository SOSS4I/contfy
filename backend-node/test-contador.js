// Test contador creation
const http = require('http');

const data = JSON.stringify({
  name: 'Maria Contadora',
  email: 'maria.contadora@teste.com',
  phone: '11988887777',
  cpf: '98765432100',
  password: 'senha123'
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/contadores',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const response = JSON.parse(body);
    console.log('Response:', JSON.stringify(response, null, 2));
    if (response.codigoContador) {
      console.log('\n🎉 CÓDIGO DO CONTADOR:', response.codigoContador);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
