import React, { useState, useEffect } from 'react'
import useTemaStore from '../../stores/useTemaStore'
import { salvarTemaFirebase } from '../../services/firebase-sync'

/**
 * Componente para criar/editar temas
 * Disponível para designers via Plasmic Studio
 */
export default function TemaEditor({
  nomeTema = 'Novo Tema',
  emoji = '🎨',
  corPrimaria = '#0ff',
  corPrimariaRgb = '0, 255, 255',
  corSecundaria = '#ff003c',
  corSecundariaRgb = '255, 0, 60',
  corDestaque = '#ffcc00',
  corDestaqueRgb = '255, 204, 0',
  bgBody1 = '#1a1a2e',
  bgBody2 = '#0f0f1a',
  bgPanel = 'rgba(25, 25, 40, 0.6)',
  borderPrimary = 'rgba(0, 255, 255, 0.2)',
  gridColor = 'rgba(0, 255, 255, 0.03)',
  shadowPrimary = 'rgba(0, 255, 255, 0.5)',
  className = ''
}) {
  const { salvarTemaCustom } = useTemaStore()
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // Variáveis completas do tema sendo editado
  const varsAtual = {
    '--cor-primaria': corPrimaria,
    '--cor-primaria-rgb': corPrimariaRgb,
    '--cor-secundaria': corSecundaria,
    '--cor-secundaria-rgb': corSecundariaRgb,
    '--cor-destaque': corDestaque,
    '--cor-destaque-rgb': corDestaqueRgb,
    '--cor-sucesso': '#0f0',
    '--cor-info': '#0088ff',
    '--bg-body-1': bgBody1,
    '--bg-body-2': bgBody2,
    '--bg-panel': bgPanel,
    '--bg-panel-hover': `rgba(${corPrimariaRgb}, 0.1)`,
    '--border-primary': borderPrimary,
    '--grid-color': gridColor,
    '--shadow-primary': shadowPrimary,
    '--font-family': "'Rajdhani', sans-serif"
  }

  // Aplica preview das variáveis CSS em tempo real
  useEffect(() => {
    const root = document.documentElement
    Object.entries(varsAtual).forEach(([chave, valor]) => {
      root.style.setProperty(chave, valor)
    })
  }, [corPrimaria, corPrimariaRgb, corSecundaria, corSecundariaRgb, corDestaque, corDestaqueRgb, bgBody1, bgBody2, bgPanel, borderPrimary, gridColor, shadowPrimary])

  const handleSalvarTema = async () => {
    if (!nomeTema || nomeTema.trim() === '') {
      setMensagem('Por favor, defina um nome para o tema')
      return
    }

    setSalvando(true)
    setMensagem('')

    try {
      const idTema = `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`

      // Salva localmente no store
      salvarTemaCustom(idTema, nomeTema, emoji, varsAtual)

      // Tenta salvar no Firebase
      try {
        await salvarTemaFirebase(idTema, {
          id: idTema,
          nome: nomeTema,
          emoji: emoji,
          descricao: `Tema custom criado`,
          vars: varsAtual,
          custom: true,
          dataCriacao: new Date().toISOString()
        })
      } catch (firebaseErr) {
        console.warn('[TemaEditor] Aviso: Não foi possível salvar no Firebase, mas o tema foi salvo localmente:', firebaseErr)
      }

      setMensagem(`Tema "${nomeTema}" salvo com sucesso!`)
      setTimeout(() => setMensagem(''), 3000)
    } catch (err) {
      console.error('[TemaEditor] Erro ao salvar tema:', err)
      setMensagem('Erro ao salvar o tema')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={`tema-editor ${className}`}>
      <div className="tema-editor-header">
        <h3 className="tema-editor-titulo">Editor de Temas</h3>
        <p className="tema-editor-subtitulo">Configure as cores do seu tema customizado</p>
      </div>

      <div className="tema-editor-preview">
        <div className="preview-header">
          <div className="preview-emoji">{emoji}</div>
          <div className="preview-info">
            <div className="preview-nome">{nomeTema || 'Novo Tema'}</div>
            <div className="preview-descricao">Tema personalizado</div>
          </div>
        </div>
      </div>

      <div className="tema-editor-grid">
        <div className="tema-editor-cores">
          <h4 className="tema-section-titulo">Cores Principais</h4>

          <div className="cor-display">
            <div className="cor-swatch" style={{ backgroundColor: corPrimaria }}></div>
            <div className="cor-info">
              <div className="cor-label">Cor Primária</div>
              <div className="cor-valor">{corPrimaria}</div>
            </div>
          </div>

          <div className="cor-display">
            <div className="cor-swatch" style={{ backgroundColor: corSecundaria }}></div>
            <div className="cor-info">
              <div className="cor-label">Cor Secundária</div>
              <div className="cor-valor">{corSecundaria}</div>
            </div>
          </div>

          <div className="cor-display">
            <div className="cor-swatch" style={{ backgroundColor: corDestaque }}></div>
            <div className="cor-info">
              <div className="cor-label">Cor Destaque</div>
              <div className="cor-valor">{corDestaque}</div>
            </div>
          </div>
        </div>

        <div className="tema-editor-fundos">
          <h4 className="tema-section-titulo">Fundos</h4>

          <div className="cor-display">
            <div className="cor-swatch" style={{ backgroundColor: bgBody1 }}></div>
            <div className="cor-info">
              <div className="cor-label">Fundo Principal</div>
              <div className="cor-valor">{bgBody1}</div>
            </div>
          </div>

          <div className="cor-display">
            <div className="cor-swatch" style={{ backgroundColor: bgBody2 }}></div>
            <div className="cor-info">
              <div className="cor-label">Fundo Secundário</div>
              <div className="cor-valor">{bgBody2}</div>
            </div>
          </div>

          <div className="cor-display">
            <div
              className="cor-swatch"
              style={{ background: bgPanel }}
            ></div>
            <div className="cor-info">
              <div className="cor-label">Painel</div>
              <div className="cor-valor">{bgPanel.substring(0, 40)}...</div>
            </div>
          </div>
        </div>
      </div>

      <div className="tema-editor-acao">
        {mensagem && (
          <div className={`tema-mensagem ${mensagem.includes('sucesso') ? 'sucesso' : 'erro'}`}>
            {mensagem}
          </div>
        )}
        <button
          className="btn-neon tema-btn-salvar"
          onClick={handleSalvarTema}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : '💾 Salvar como Tema'}
        </button>
      </div>

      <div className="tema-editor-info">
        <p>
          Este editor permite que você crie temas customizados. As cores são aplicadas em tempo real e podem ser salvas para uso posterior.
        </p>
      </div>
    </div>
  )
}
