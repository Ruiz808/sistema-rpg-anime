const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '..', 'app')));

app.listen(3000, () => {
    console.log('\n===========================================');
    console.log('🚀 SERVIDOR ESTÁTICO RPG ONLINE!');
    console.log('👉 Acesse: http://localhost:3000');
    console.log('   (Multiplayer via Firebase — sem Socket.io)');
    console.log('===========================================\n');
});
