/**
 * SCRIPT DE MIGRAÇÃO: banco_de_dados_rpg.json → Firebase Realtime Database
 *
 * USO:
 * 1. Baixe a chave de serviço do Firebase:
 *    Console Firebase → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada
 * 2. Salve o arquivo JSON como "firebase-service-account.json" nesta pasta
 * 3. Defina a variável de ambiente: export FIREBASE_DATABASE_URL=https://SEU-PROJETO-default-rtdb.firebaseio.com
 * 4. Execute: node migrar-firebase.js
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAR VIA VARIÁVEIS DE AMBIENTE:
//   FIREBASE_DATABASE_URL (obrigatório)
//   FIREBASE_SERVICE_ACCOUNT_PATH (opcional, default: ./firebase-service-account.json)
// ==========================================
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL;
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-service-account.json');
const BANCO_PATH = path.join(__dirname, 'banco_de_dados_rpg.json');

if (!DATABASE_URL) {
    console.error('❌ Variável FIREBASE_DATABASE_URL não definida!');
    console.error('   Defina com: export FIREBASE_DATABASE_URL=https://SEU-PROJETO-default-rtdb.firebaseio.com');
    process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Arquivo firebase-service-account.json não encontrado!');
    console.error('   Baixe em: Console Firebase → Configurações → Contas de Serviço → Gerar chave privada');
    process.exit(1);
}

if (!fs.existsSync(BANCO_PATH)) {
    console.error('❌ banco_de_dados_rpg.json não encontrado!');
    process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL
});

const db = admin.database();
const banco = JSON.parse(fs.readFileSync(BANCO_PATH, 'utf8'));
const personagens = Object.keys(banco);

if (personagens.length === 0) {
    console.log('⚠️ Nenhum personagem encontrado no banco local.');
    process.exit(0);
}

console.log(`\n📦 Migrando ${personagens.length} personagem(ns): ${personagens.join(', ')}\n`);

db.ref('personagens').set(banco)
    .then(() => {
        console.log('✅ Migração concluída com sucesso!');
        console.log('   Dados disponíveis em: Firebase Console → Realtime Database → personagens');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro durante migração:', err.message);
        process.exit(1);
    });
