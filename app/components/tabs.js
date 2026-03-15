// ==========================================
// COMPONENTE: Navegação de Abas
// ==========================================

export function mudarAba(idAba, el) {
    try {
        let panels = document.querySelectorAll('.glass-panel');
        for (let i = 0; i < panels.length; i++) panels[i].classList.remove('ativo');
        let btns = document.querySelectorAll('.nav-btn');
        for (let i = 0; i < btns.length; i++) btns[i].classList.remove('ativo');
        let aba = document.getElementById(idAba);
        if (aba) aba.classList.add('ativo');
        if (el) el.classList.add('ativo');
        if (idAba === 'aba-ficha') window.carregarAtributoNaTela();
        if (idAba === 'aba-status') window.atualizarBarrasVisuais();
        if (idAba === 'aba-poderes') window.renderizarListaPoderes();
        if (idAba === 'aba-arsenal') window.renderizarInventario();
        if (idAba === 'aba-elementos') window.renderizarElementos();
        if (idAba === 'aba-ataque') {
            window.carregarConfigAtaqueInicial();
            window.atualizarInputsDeDano();
        }
        if (idAba === 'aba-perfil' || idAba === 'aba-mestre') window.renderizarListaPersonagensLocal();
        if (idAba === 'aba-mapa') window.initMap();
    } catch (e) { }
}
