// ==========================================
// COMPONENTE: Feed de Combate (Log)
// ==========================================

export function renderizarFeed(d) {
    let feed = document.getElementById('feed-combate');
    if (feed.innerHTML.includes("Aguardando")) feed.innerHTML = '';
    let div = document.createElement('div');
    div.className = 'damage-log';

    if (d.tipo === 'acerto') {
        div.style.borderLeftColor = '#f90';
        div.style.background = 'rgba(255,153,0,0.1)';
        div.innerHTML = '<p style="color:#f90;">🎯 <strong>' + d.nome + '</strong> rolou Acerto usando <strong>' + d.atributosUsados + '</strong>' + d.armaStr + ':</p><h1 class="damage-number" style="color:#f90; text-shadow:0 0 20px rgba(255,153,0,0.8);">' + d.acertoTotal + '</h1><p class="lethality" style="color:#fff;">' + d.profBonusTexto + '</p><div class="log-details">🎲 Rolagem Base: ' + d.rolagem + '</div>';
    } else if (d.tipo === 'evasiva') {
        div.style.borderLeftColor = '#0088ff';
        div.style.background = 'rgba(0,136,255,0.1)';
        div.innerHTML = '<p style="color:#0088ff;">💨 <strong>' + d.nome + '</strong> declarou Esquiva' + d.armaStr + ':</p><h1 class="damage-number" style="color:#0088ff; text-shadow:0 0 20px rgba(0,136,255,0.8);">' + d.total + '</h1><div class="log-details">' + d.baseCalc + '</div>';
    } else if (d.tipo === 'resistencia') {
        div.style.borderLeftColor = '#ccc';
        div.style.background = 'rgba(200,200,200,0.1)';
        div.innerHTML = '<p style="color:#ccc;">🛡️ <strong>' + d.nome + '</strong> declarou Bloqueio' + d.armaStr + ':</p><h1 class="damage-number" style="color:#ccc; text-shadow:0 0 20px rgba(200,200,200,0.8);">' + d.total + '</h1><div class="log-details">' + d.baseCalc + '</div>';
    } else if (d.tipo === 'escudo') {
        let tg = d.vitalidade > 0 ? ' <span style="color:#ffcc00;">(🌟 Vit: +' + d.vitalidade + ')</span>' : '';
        div.style.borderLeftColor = '#f0f';
        div.style.background = 'rgba(255,0,255,0.1)';
        div.innerHTML = '<p style="color:#f0f;">✨ <strong>' + d.nome + '</strong> ativou Escudo' + d.armaStr + ':</p><h1 class="damage-number" style="color:#f0f; text-shadow:0 0 20px rgba(255,0,255,0.8);">' + d.escudoReduzido.toLocaleString('pt-BR') + tg + '</h1><div class="log-details">' + d.detalhe + '</div>';
    } else {
        div.innerHTML = '<p>💥 <strong>' + d.nome + '</strong> atacou usando <strong>' + d.atributosUsados + '</strong>' + d.armaStr + ':</p><h1 class="damage-number">' + d.dano.toLocaleString('pt-BR') + '</h1><p class="lethality">💀 LETALIDADE: ' + (d.letalidade > 0 ? '+' + d.letalidade : '0') + '</p><div class="log-details">🎲 Rolagem de Dados: ' + d.rolagem + d.rolagemMagica + (d.detalheEnergia || '') + (d.detalheConta || '') + '</div>';
    }
    feed.prepend(div);
}
