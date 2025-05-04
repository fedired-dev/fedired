/**
 * @copyright (c) 2024 Fedired - AGPL-3.0
 */

// Tipos de respuesta de la API
interface ApiResponse {
  status: number;
  data: {
    verified?: boolean;
    error?: string;
    metadata?: {
      verificationDate: string;
      verificationMethod: string;
      lastChecked: string;
    };
  };
}

// Configuración de la API
const API_CONFIG = {
  baseUrl: 'https://apifedired-hub.netlify.app/',
  endpoints: {
    verify: '/verify',
    status: '/status',
    history: '/verification-history',
    bulk: '/bulk-verify'
  },
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'test-key-123',
    'X-Request-ID': () => Math.random().toString(36).substring(7)
  }
};

// Simulación de base de datos de usuarios
const MOCK_DATABASE = {
  users: {
    'admin': { verified: true, role: 'admin', joinDate: '2023-01-01' },
    'moderator': { verified: true, role: 'moderator', joinDate: '2023-02-15' },
    'usuario123': { verified: false, role: 'user', joinDate: '2023-03-20' },
    'premium_user': { verified: true, role: 'premium', joinDate: '2023-04-10' },
    'new_user': { verified: false, role: 'user', joinDate: '2023-05-01' }
  },
  verificationMethods: ['email', 'phone', 'document', 'social'],
  verificationHistory: new Map()
};

// Simulación de llamada HTTP
const mockHttpRequest = async (url: string, options: any): Promise<ApiResponse> => {
  console.log(`🌐 Realizando petición HTTP a: ${url}`);
  console.log(`📦 Opciones: ${JSON.stringify(options, null, 2)}`);
  
  // Simulamos diferentes escenarios de red
  const networkScenarios = [
    { latency: 500, success: true },
    { latency: 1000, success: true },
    { latency: 2000, success: false },
    { latency: 3000, success: true }
  ];

  const scenario = networkScenarios[Math.floor(Math.random() * networkScenarios.length)];
  console.log(`⏱️ Latencia de red simulada: ${scenario.latency}ms`);
  await new Promise(resolve => setTimeout(resolve, scenario.latency));

  if (!scenario.success) {
    throw new Error('Error de conexión');
  }

  return {
    status: 200,
    data: {
      verified: true,
      metadata: {
        verificationDate: new Date().toISOString(),
        verificationMethod: MOCK_DATABASE.verificationMethods[Math.floor(Math.random() * MOCK_DATABASE.verificationMethods.length)],
        lastChecked: new Date().toISOString()
      }
    }
  };
};

// Simulación de llamada a API con retry
const mockApiCall = async (username: string, retries = 3): Promise<ApiResponse> => {
  try {
    console.log(`🔍 Iniciando verificación para: ${username}`);
    console.log(`🌐 Conectando a ${API_CONFIG.baseUrl}${API_CONFIG.endpoints.verify}`);
    console.log(`🔑 Usando API Key: ${API_CONFIG.headers['X-API-Key']}`);
    console.log(`🆔 Request ID: ${API_CONFIG.headers['X-Request-ID']()}`);

    const response = await mockHttpRequest(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.verify}`,
      {
        method: 'GET',
        headers: API_CONFIG.headers,
        params: { username }
      }
    );

    console.log(`📡 Respuesta del servidor: ${JSON.stringify(response, null, 2)}`);

    // Registrar en el historial
    MOCK_DATABASE.verificationHistory.set(username, {
      timestamp: new Date().toISOString(),
      response
    });

    return response;
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    if (retries > 0) {
      console.log(`🔄 Reintentando... (${retries} intentos restantes)`);
      return mockApiCall(username, retries - 1);
    }
    throw error;
  }
};

// Función para verificación en lote
const bulkVerification = async (usernames: string[]): Promise<Map<string, boolean>> => {
  console.log('🚀 Iniciando verificación en lote...');
  const results = new Map<string, boolean>();
  
  for (const username of usernames) {
    try {
      const response = await mockApiCall(username);
      results.set(username, response.status === 200 && response.data.verified === true);
    } catch (error) {
      results.set(username, false);
    }
  }
  
  return results;
};

// Función para obtener historial de verificaciones
const getVerificationHistory = (username: string) => {
  return MOCK_DATABASE.verificationHistory.get(username);
};

// Función para mostrar estadísticas
const showStatistics = () => {
  console.log('\n📊 Estadísticas de verificación:');
  console.log(`- Total de usuarios: ${Object.keys(MOCK_DATABASE.users).length}`);
  console.log(`- Usuarios verificados: ${Object.values(MOCK_DATABASE.users).filter(u => u.verified).length}`);
  console.log(`- Verificaciones realizadas: ${MOCK_DATABASE.verificationHistory.size}`);
  
  const methods = new Map<string, number>();
  MOCK_DATABASE.verificationHistory.forEach(entry => {
    const method = entry.response.data.metadata?.verificationMethod || 'unknown';
    methods.set(method, (methods.get(method) || 0) + 1);
  });
  
  console.log('\n📈 Métodos de verificación utilizados:');
  methods.forEach((count, method) => {
    console.log(`- ${method}: ${count} veces`);
  });
};

// Función principal de prueba
export const testVerification = async () => {
  console.log('🚀 Iniciando pruebas de verificación...\n');
  
  // Prueba individual
  console.log('📝 Prueba de verificación individual:');
  const testUser = 'admin';
  const response = await mockApiCall(testUser);
  console.log(`✅ Resultado para ${testUser}: ${response.data.verified ? 'Verificado' : 'No verificado'}`);
  
  // Prueba en lote
  console.log('\n📦 Prueba de verificación en lote:');
  const users = ['admin', 'moderator', 'usuario123', 'premium_user', 'new_user'];
  const bulkResults = await bulkVerification(users);
  
  console.log('\n📊 Resultados de verificación en lote:');
  bulkResults.forEach((verified, username) => {
    console.log(`- ${username}: ${verified ? '✅ Verificado' : '❌ No verificado'}`);
  });
  
  // Mostrar historial
  console.log('\n📜 Historial de verificaciones:');
  users.forEach(username => {
    const history = getVerificationHistory(username);
    if (history) {
      console.log(`\n📝 Historial para ${username}:`);
      console.log(`- Fecha: ${history.timestamp}`);
      console.log(`- Estado: ${history.response.status}`);
      console.log(`- Verificado: ${history.response.data.verified ?? 'N/A'}`);
    }
  });
  
  // Mostrar estadísticas
  showStatistics();
  
  console.log('\n✨ Pruebas completadas');
};

// Ejecutar las pruebas
testVerification();