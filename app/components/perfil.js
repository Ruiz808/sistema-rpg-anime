// ==========================================
// COMPONENTE: Perfil, Sessão e Painel do Mestre
// ==========================================
import { minhaFicha, meuNome, fichaPadrao, personagemParaDeletar, setMeuNome, setPersonagemParaDeletar, carregarDadosFicha } from '../state/store.js';
import { db } from '../services/firebase-config.js';
import { carregarFichaDoFirebase, deletarPersonagem } from '../services/firebase-sync.js';

export function renderizarListaPersonagensLocal() {
    let html = '';
    for (let i = 0; i < localStorage.length; i++) {
        let k = localStorage.key(i);
        if (k.startsWith("rpgFicha_")) {
            let n = k.replace("rpgFicha_", "");
            let mark = (n === meuNome) ? ' <span style="color:#0f0;font-size:0.6em;">(ATUAL)</span>' : '';
            html += '<div class="char-card"><div class="char-name">' + n + mark + '</div><div class="char-actions"><button class="btn-neon btn-gold btn-small" onclick="window.carregarPersonagemExistente(\'' + n + '\')">▶ CARREGAR</button></div></div>';
        }
    }
    if (!html) html = '<p style="color:#888;">Nenhum personagem encontrado no seu navegador.</p>';
    let elJogador = document.getElementById('lista-personagens-jogador');
    if (elJogador) elJogador.innerHTML = html;

    let elMestre = document.getElementById('lista-personagens-mestre');
    if (elMestre && !db) {
        let htmlMestre = '';
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k.startsWith("rpgFicha_")) {
                let n = k.replace("rpgFicha_", "");
                let mark = (n === meuNome) ? ' <span style="color:#0f0;font-size:0.6em;">(ATUAL)</span>' : '';
                htmlMestre += '<div class="char-card"><div class="char-name">' + n + mark + '</div><div class="char-actions"><button class="btn-neon btn-gold btn-small" onclick="window.carregarPersonagemExistente(\'' + n + '\')">▶ CARREGAR</button><button class="btn-neon btn-red btn-small" onclick="window.abrirModalDelete(\'' + n + '\')">🗑️ APAGAR</button></div></div>';
            }
        }
        elMestre.innerHTML = htmlMestre;
    }
}

export function toggleMestre() {
    let isM = document.getElementById('chk-mestre').checked;
    localStorage.setItem("rpgIsMestre", isM ? "sim" : "nao");
    document.getElementById('btn-mestre').style.display = isM ? 'block' : 'none';
    if (!isM && document.getElementById('aba-mestre').classList.contains('ativo')) {
        window.mudarAba('aba-status', document.querySelectorAll('.nav-btn')[2]);
    }
}

export function trocarPersonagem() {
    let n = document.getElementById('perfil-nome').value.trim();
    if (n === "") return;
    setMeuNome(n);
    localStorage.setItem("rpgNome", n);
    Object.assign(minhaFicha, JSON.parse(JSON.stringify(fichaPadrao)));
    let bl = localStorage.getItem("rpgFicha_" + n);
    if (bl) { try { carregarDadosFicha(JSON.parse(bl)); } catch (e) { } }
    if (db) {
        carregarFichaDoFirebase(n).then(function (dados) {
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
            window.carregarConfigAtaqueInicial();
            window.inicializarAtuais();
            window.carregarTabelaPrestigio();
            window.atualizarBarrasVisuais();
            window.renderizarListaPoderes();
            window.renderizarInventario();
            window.renderizarElementos();
            window.atualizarInputsDeDano();
            window.renderizarListaPersonagensLocal();
            // Preenche a caixa visual da Imagem Base
            let inputImg = document.getElementById('perfil-imagem');
            if (inputImg) {
            inputImg.value = (minhaFicha.avatar && minhaFicha.avatar.base) ? minhaFicha.avatar.base : "";
            }
        });
    }
    window.carregarConfigAtaqueInicial();
    window.inicializarAtuais();
    window.carregarTabelaPrestigio();
    window.atualizarBarrasVisuais();
    window.renderizarListaPoderes();
    window.renderizarInventario();
    window.renderizarElementos();
    window.atualizarInputsDeDano();
    window.renderizarListaPersonagensLocal();
    window.mudarAba('aba-status');
}

export function carregarPersonagemExistente(n) {
    document.getElementById('perfil-nome').value = n;
    trocarPersonagem();
}

export function abrirModalDelete(n) {
    setPersonagemParaDeletar(n);
    document.getElementById('delete-char-name').innerText = n;
    document.getElementById('modal-delete').style.display = 'flex';
}

export function fecharModalDelete() {
    document.getElementById('modal-delete').style.display = 'none';
    setPersonagemParaDeletar("");
}

export function confirmarDelecao() {
    deletarPersonagem(personagemParaDeletar);
    if (meuNome === personagemParaDeletar) {
        setMeuNome("Sem Nome");
        localStorage.setItem("rpgNome", meuNome);
        document.getElementById('perfil-nome').value = meuNome;
        trocarPersonagem();
    }
    fecharModalDelete();
    renderizarListaPersonagensLocal();
}
