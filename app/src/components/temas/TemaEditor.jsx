import { useState, useEffect } from "react";
import {
  salvarTema, listarTemas, deletarTema,
  duplicarTema, aplicarTema, ativarTema
} from "../../services/temas";

const VARS_TEMA = [
  { grupo: "Fundo e Superfície", vars: [
    { id: "--cor-fundo",      label: "Fundo geral" },
    { id: "--cor-superficie", label: "Superfície" },
    { id: "--cor-painel",     label: "Painel (use hex)" },
    { id: "--cor-borda",      label: "Bordas" },
  ]},
  { grupo: "Texto", vars: [
    { id: "--cor-texto-primario",   label: "Texto primário" },
    { id: "--cor-texto-secundario", label: "Texto secundário" },
    { id: "--cor-titulo",           label: "Títulos" },
    { id: "--cor-label",            label: "Labels" },
  ]},
  { grupo: "Barras de Status", vars: [
    { id: "--cor-vida",   label: "Vida (HP)" },
    { id: "--cor-mana",   label: "Mana" },
    { id: "--cor-aura",   label: "Aura" },
    { id: "--cor-chakra", label: "Chakra" },
    { id: "--cor-corpo",  label: "Corpo" },
  ]},
  { grupo: "Energias", vars: [
    { id: "--cor-pv", label: "Pontos Vitais" },
    { id: "--cor-pm", label: "Pontos Mortais" },
  ]},
  { grupo: "Acento e Destaque", vars: [
    { id: "--cor-acento",   label: "Acento" },
    { id: "--cor-destaque", label: "Destaque" },
    { id: "--cor-sucesso",  label: "Sucesso" },
    { id: "--cor-perigo",   label: "Perigo" },
  ]},
  { grupo: "Sidebar", vars: [
    { id: "--cor-sidebar",       label: "Sidebar fundo" },
    { id: "--cor-sidebar-ativo", label: "Sidebar ativo (hex)" },
  ]},
  { grupo: "Elementos", vars: [
    { id: "--cor-fogo",      label: "Fogo" },
    { id: "--cor-gelo",      label: "Gelo" },
    { id: "--cor-natureza",  label: "Natureza" },
    { id: "--cor-energia",   label: "Energia" },
    { id: "--cor-vacuo",     label: "Vácuo" },
    { id: "--cor-luz",       label: "Luz" },
    { id: "--cor-trevas",    label: "Trevas" },
    { id: "--cor-ether",     label: "Éter" },
    { id: "--cor-celestial", label: "Celestial" },
    { id: "--cor-solar",     label: "Solar" },
  ]},
];

const TEMA_PADRAO = {
  "--cor-fundo": "#0a0a1a", "--cor-superficie": "#0d1117",
  "--cor-painel": "#000000", "--cor-borda": "#1a1a2e",
  "--cor-texto-primario": "#ffffff", "--cor-texto-secundario": "#aaaaaa",
  "--cor-titulo": "#00ffff", "--cor-label": "#00ffff",
  "--cor-vida": "#ff0000", "--cor-mana": "#00ffff",
  "--cor-aura": "#ffaa00", "--cor-chakra": "#ffffff",
  "--cor-corpo": "#ff00ff", "--cor-pv": "#00ff00",
  "--cor-pm": "#cc00ff", "--cor-acento": "#00ffff",
  "--cor-destaque": "#ff6600", "--cor-sucesso": "#00ff88",
  "--cor-perigo": "#ff3333", "--cor-sidebar": "#0d0d1a",
  "--cor-sidebar-ativo": "#002222", "--cor-fogo": "#ff6600",
  "--cor-gelo": "#99ffff", "--cor-natureza": "#66ff66",
  "--cor-energia": "#ff66ff", "--cor-vacuo": "#999999",
  "--cor-luz": "#ffffff", "--cor-trevas": "#800000",
  "--cor-ether": "#b366ff", "--cor-celestial": "#ffffcc",
  "--cor-solar": "#ff6600",
};

export default function TemaEditor({ onFechar }) {
  const [temas, setTemas] = useState([]);
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const [nomeNovo, setNomeNovo] = useState("");
  const [variaveis, setVariaveis] = useState({ ...TEMA_PADRAO });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { carregarTemas(); }, []);

  async function carregarTemas() {
    const lista = await listarTemas();
    setTemas(lista);
  }

  function selecionarTema(tema) {
    setTemaSelecionado(tema);
    setNomeNovo(tema.nome);
    setVariaveis({ ...TEMA_PADRAO, ...tema.variaveis });
    aplicarTema({ ...TEMA_PADRAO, ...tema.variaveis });
  }

  function novoTema() {
    setTemaSelecionado(null);
    setNomeNovo("");
    setVariaveis({ ...TEMA_PADRAO });
  }

  async function salvar() {
    if (!nomeNovo.trim()) { setMsg("⚠️ Digite um nome para o tema!"); return; }
    setSalvando(true);
    try {
      await salvarTema(nomeNovo.trim(), variaveis);
      setMsg("✅ Tema salvo!");
      await carregarTemas();
    } catch(e) { setMsg("❌ Erro: " + e.message); }
    setSalvando(false);
  }

  async function ativar(id) {
    await ativarTema(id);
    setMsg("🎨 Tema ativado!");
  }

  async function deletar(id) {
    if (!confirm("Deletar este tema?")) return;
    await deletarTema(id);
    setMsg("🗑️ Tema deletado!");
    await carregarTemas();
    if (temaSelecionado?.id === id) novoTema();
  }

  async function duplicar(id, nome) {
    const novoNome2 = prompt("Nome para o novo tema:", nome + " (cópia)");
    if (!novoNome2) return;
    await duplicarTema(id, novoNome2);
    setMsg("📋 Tema duplicado!");
    await carregarTemas();
  }

  function mudarVar(id, valor) {
    const novas = { ...variaveis, [id]: valor };
    setVariaveis(novas);
    aplicarTema(novas);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 9999, display: "flex", alignItems: "flex-start",
      justifyContent: "center", padding: "20px", overflowY: "auto"
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid #00ffff",
        borderRadius: "12px", width: "100%", maxWidth: "900px",
        padding: "24px", color: "#fff", fontFamily: "Rajdhani, sans-serif"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#00ffff", margin: 0, fontFamily: "Orbitron, sans-serif" }}>
            🎨 Editor de Temas
          </h2>
          <button onClick={onFechar} style={btnStyle("#333", "#fff")}>✕ Fechar</button>
        </div>

        {msg && (
          <div style={{ background: "#1a2a1a", border: "1px solid #00ff88",
            borderRadius: "6px", padding: "8px 12px", marginBottom: "16px", color: "#00ff88" }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px" }}>
          {/* LISTA DE TEMAS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#aaa", fontSize: "12px" }}>TEMAS SALVOS</span>
              <button onClick={novoTema} style={btnStyle("#003322", "#00ff88")}>+ Novo</button>
            </div>
            {temas.length === 0 && (
              <div style={{ color: "#555", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                Nenhum tema salvo ainda
              </div>
            )}
            {temas.map(t => (
              <div key={t.id} onClick={() => selecionarTema(t)} style={{
                padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
                border: `1px solid ${temaSelecionado?.id === t.id ? "#00ffff" : "#222"}`,
                background: temaSelecionado?.id === t.id ? "rgba(0,255,255,0.08)" : "#111",
                cursor: "pointer"
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{t.nome}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={(e) => { e.stopPropagation(); ativar(t.id); }}
                    style={btnStyle("#003300", "#00ff00")}>▶ Ativar</button>
                  <button onClick={(e) => { e.stopPropagation(); duplicar(t.id, t.nome); }}
                    style={btnStyle("#002233", "#00aaff")}>⧉</button>
                  <button onClick={(e) => { e.stopPropagation(); deletar(t.id); }}
                    style={btnStyle("#330000", "#ff4444")}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {/* EDITOR */}
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                NOME DO TEMA
              </label>
              <input value={nomeNovo} onChange={e => setNomeNovo(e.target.value)}
                placeholder="Ex: Cyberpunk Neon, Samurai Dark..."
                style={{ width: "100%", padding: "8px 12px", background: "#1a1a2e",
                  border: "1px solid #333", borderRadius: "6px", color: "#fff",
                  fontSize: "14px", boxSizing: "border-box" }} />
            </div>

            {VARS_TEMA.map(grupo => (
              <div key={grupo.grupo} style={{ marginBottom: "16px" }}>
                <div style={{ color: "#00ffff", fontSize: "11px", fontWeight: "bold",
                  letterSpacing: "2px", marginBottom: "8px", borderBottom: "1px solid #1a1a2e",
                  paddingBottom: "4px" }}>
                  {grupo.grupo.toUpperCase()}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                  {grupo.vars.map(v => (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="color" value={variaveis[v.id] || "#000000"}
                        onChange={e => mudarVar(v.id, e.target.value)}
                        style={{ width: "36px", height: "28px", border: "none",
                          background: "none", cursor: "pointer", padding: 0 }} />
                      <div>
                        <div style={{ fontSize: "12px", color: "#ddd" }}>{v.label}</div>
                        <div style={{ fontSize: "10px", color: "#555" }}>{v.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={salvar} disabled={salvando}
              style={{ ...btnStyle("#003344", "#00ffff"), padding: "10px 24px",
                fontSize: "14px", width: "100%", marginTop: "8px" }}>
              {salvando ? "Salvando..." : "💾 Salvar Tema"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    background: bg, color, border: `1px solid ${color}`,
    borderRadius: "4px", padding: "4px 10px", cursor: "pointer",
    fontSize: "12px", fontFamily: "Rajdhani, sans-serif"
  };
}
