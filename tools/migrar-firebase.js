/**
 * SCRIPT DE MIGRAÇÃO: banco_de_dados_rpg.json → Firebase Realtime Database
 *
 * USO:
 * 1. Baixe a chave de serviço do Firebase:
 *    Console Firebase → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada
 * 2. Salve o arquivo JSON como "firebase-service-account.json" nesta pasta
 * 3. Preencha a databaseURL abaixo com a URL do seu Realtime Database
 * 4. Execute: node migrar-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAR ANTES DE EXECUTAR:
// ==========================================
const DATABASE_URL = 'https://databaserpg-5595b-default-rtdb.firebaseio.com';
const SERVICE_ACCOUNT_PATH = 'c:\\Users\\Gabriel\\Downloads\\databaserpg-5595b-firebase-adminsdk-fbsvc-e1e26dd20c.json';
const BANCO_PATH = path.join(__dirname, 'banco_de_dados_rpg.json');
// ==========================================

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Arquivo firebase-service-account.json não encontrado!');
    console.error('   Baixe em: Console Firebase → Configurações → Contas de Serviço → Gerar chave privada');
    process.exit(1);
}

if (!fs.existsSync(BANCO_PATH)) {
    console.error('❌ banco_de_dados_rpg.json não encontrado!');
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
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
