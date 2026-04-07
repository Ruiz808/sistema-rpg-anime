import React, { useCallback } from 'react'
import useTemaStore from '../../stores/useTemaStore'

/**
 * Componente para seleção de temas
 * Mostra cards com todos os temas (padrão + custom)
 */
export default function TemaSelector({ className = '' }) {
  const { temaAtivo, getTodosOsTemas, setTema } = useTemaStore()
  const todosTemas = getTodosOsTemas()

  const handleSelecionarTema = useCallback((id) => {
    setTema(id)
  }, [setTema])

  return (
    <div className={`tema-selector ${className}`}>
      <h3 className="tema-selector-titulo">Temas Disponíveis</h3>
      <div className="tema-grid">
        {Object.values(todosTemas).map((tema) => (
          <div
            key={tema.id}
            className={`tema-card ${temaAtivo === tema.id ? 'ativo' : ''}`}
            onClick={() => handleSelecionarTema(tema.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelecionarTema(tema.id)
              }
            }}
            style={{
              '--card-primary': tema.vars['--cor-primaria'] || '#0ff',
              '--card-secondary': tema.vars['--cor-secundaria'] || '#ff003c',
              '--card-bg': tema.vars['--bg-panel'] || 'rgba(25, 25, 40, 0.6)'
            }}
          >
            <div className="tema-emoji">{tema.emoji}</div>
            <div className="tema-nome">{tema.nome}</div>
            <div className="tema-descricao">{tema.descricao}</div>
            {tema.custom && <div className="tema-badge-custom">Custom</div>}
            {temaAtivo === tema.id && <div className="tema-badge-ativo">Ativo</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
