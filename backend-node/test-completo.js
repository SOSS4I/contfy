// Teste completo de todas as funcionalidades
const http = require('http');

const API_URL = 'localhost';
const API_PORT = 8000;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const dataString = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function test(name, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${name}`);
  } else {
    failedTests++;
    console.log(`✗ ${name}`);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 TESTANDO BACKEND NODE.JS - TODAS AS FUNCIONALIDADES');
  console.log('='.repeat(60));
  console.log();

  // 1. Health Check
  console.log('📍 1. HEALTH CHECK');
  try {
    const health = await makeRequest('GET', '/api/v1/health');
    test('Health check retorna 200', health.status === 200);
    test('Health check tem status "ok"', health.data.status === 'ok');
  } catch (e) {
    test('Health check', false);
  }
  console.log();

  // 2. Listar Clientes
  console.log('📍 2. LISTAR CLIENTES');
  try {
    const clientes = await makeRequest('GET', '/api/v1/clientes');
    test('Listar clientes retorna 200', clientes.status === 200);
    test('Clientes tem array "data"', Array.isArray(clientes.data.data));
    test('Clientes tem total', typeof clientes.data.total === 'number');
  } catch (e) {
    test('Listar clientes', false);
  }
  console.log();

  // 3. Buscar Cliente por Email (Login)
  console.log('📍 3. BUSCAR CLIENTE POR EMAIL (Simulando Login)');
  try {
    const cliente = await makeRequest('GET', '/api/v1/clientes?email=ssnegociosdigitaisltda@gmail.com');
    test('Buscar por email retorna 200', cliente.status === 200);
    test('Retorna exatamente 1 cliente', cliente.data.data.length === 1);
    test('Cliente tem ID 14', cliente.data.data[0].id === 14);
    test('Cliente tem nome correto', cliente.data.data[0].name === 'SS NEGOCIOS DIGITAIS LTDA');
  } catch (e) {
    test('Buscar cliente por email', false);
  }
  console.log();

  // 4. Criar Cliente
  console.log('📍 4. CRIAR NOVO CLIENTE');
  let novoClienteId = null;
  try {
    const novoCliente = await makeRequest('POST', '/api/v1/clientes', {
      name: 'Empresa Teste Ltd' + Date.now(),
      email: 'teste' + Date.now() + '@example.com',
      cnpj: '99.999.999/0001-' + Math.floor(10 + Math.random() * 90),
      phone: '11999999999',
      tax_regime: 'SIMPLES_NACIONAL',
      status: 'ativo'
    });
    test('Criar cliente retorna 201', novoCliente.status === 201);
    test('Cliente criado tem ID', novoCliente.data.data && novoCliente.data.data.id);
    if (novoCliente.data.data) novoClienteId = novoCliente.data.data.id;
  } catch (e) {
    test('Criar cliente', false);
  }
  console.log();

  // 5. Buscar Cliente por ID
  if (novoClienteId) {
    console.log('📍 5. BUSCAR CLIENTE POR ID');
    try {
      const cliente = await makeRequest('GET', `/api/v1/clientes/${novoClienteId}`);
      test('Buscar cliente por ID retorna 200', cliente.status === 200);
      test('Cliente encontrado tem ID correto', cliente.data.data.id === novoClienteId);
    } catch (e) {
      test('Buscar cliente por ID', false);
    }
    console.log();
  }

  // 6. Criar Contador
  console.log('📍 6. CRIAR CONTADOR COM CÓDIGO ÚNICO');
  let contadorCodigo = null;
  try {
    const timestamp = Date.now();
    const cpf = String(timestamp).slice(-11); // Use last 11 digits of timestamp as CPF
    const contador = await makeRequest('POST', '/api/v1/contadores', {
      name: 'Contador Teste ' + timestamp,
      email: 'contador' + timestamp + '@test.com',
      phone: '11988887777',
      cpf: cpf,
      password: 'senha123'
    });
    test('Criar contador retorna 201', contador.status === 201);
    test('Contador tem código de 6 dígitos', contador.data.codigoContador && contador.data.codigoContador.length === 6);
    test('Código é numérico', /^\d{6}$/.test(contador.data.codigoContador));
    if (contador.data.codigoContador) contadorCodigo = contador.data.codigoContador;
  } catch (e) {
    test('Criar contador', false);
  }
  console.log();

  // 7. Buscar Contador por Código
  if (contadorCodigo) {
    console.log('📍 7. BUSCAR CONTADOR POR CÓDIGO');
    try {
      const contador = await makeRequest('GET', `/api/v1/contadores/codigo/${contadorCodigo}`);
      test('Buscar contador por código retorna 200', contador.status === 200);
      test('Contador encontrado tem código correto', contador.data.codigoContador === contadorCodigo);
      test('Contador não retorna senha', !contador.data.passwordHash);
    } catch (e) {
      test('Buscar contador por código', false);
    }
    console.log();
  }

  // 8. Vincular Cliente ao Contador
  if (novoClienteId && contadorCodigo) {
    console.log('📍 8. VINCULAR CLIENTE AO CONTADOR');
    try {
      const vinculo = await makeRequest('POST', `/api/v1/contadores/vincular?client_id=${novoClienteId}`, {
        codigo_contador: contadorCodigo
      });
      test('Vincular retorna 200', vinculo.status === 200);
      test('Vinculação retorna mensagem de sucesso', vinculo.data.message && vinculo.data.message.includes('sucesso'));

      // Verificar vinculação
      const clienteVinculado = await makeRequest('GET', `/api/v1/clientes/${novoClienteId}`);
      test('Cliente agora tem contador vinculado', clienteVinculado.data.data.contadorId !== null);
    } catch (e) {
      test('Vincular cliente ao contador', false);
    }
    console.log();
  }

  // 9. Listar Documentos
  console.log('📍 9. LISTAR DOCUMENTOS');
  try {
    const docs = await makeRequest('GET', '/api/v1/documentos?client_id=14');
    test('Listar documentos retorna 200', docs.status === 200);
    test('Documentos tem array "data"', Array.isArray(docs.data.data));
  } catch (e) {
    test('Listar documentos', false);
  }
  console.log();

  // 10. Buscar Contador Existente (do banco)
  console.log('📍 10. BUSCAR CONTADOR EXISTENTE (019796)');
  try {
    const contadorExistente = await makeRequest('GET', '/api/v1/contadores/codigo/019796');
    test('Contador existente encontrado', contadorExistente.status === 200);
    test('Contador tem nome "João Silva Contabilidade"',
      contadorExistente.data.name === 'João Silva Contabilidade');
  } catch (e) {
    test('Buscar contador existente', false);
  }
  console.log();

  // Limpar dados de teste
  if (novoClienteId) {
    console.log('🧹 Limpando dados de teste...');
    try {
      await makeRequest('DELETE', `/api/v1/clientes/${novoClienteId}`);
      console.log('✓ Cliente de teste removido');
    } catch (e) {
      console.log('✗ Erro ao remover cliente de teste');
    }
  }

  // Resultados
  console.log();
  console.log('='.repeat(60));
  console.log('📊 RESULTADOS DOS TESTES');
  console.log('='.repeat(60));
  console.log(`Total de testes: ${totalTests}`);
  console.log(`✓ Passou: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`✗ Falhou: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! BACKEND 100% FUNCIONAL!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
}

runTests().catch(console.error);
