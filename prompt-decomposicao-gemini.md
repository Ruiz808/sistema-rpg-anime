# Tarefa: Completar Decomposição de Componentes React para Plasmic

## Contexto do Projeto
Sistema de ficha RPG anime em React 18 + Zustand + Firebase Realtime Database.
Estamos decompondo componentes monolíticos (Panels) em pares:
- **FormContext** (.js) → Context + Provider com toda a lógica/estado
- **SubComponents** (.jsx) → Componentes UI puros que consomem o Context via hook

Objetivo: permitir que o Plasmic (visual builder) consiga usar cada sub-componente individualmente para montar layouts.

## Estado Atual (Atualizado em 2026-04-01)

**O que JÁ foi feito:**
- 11 pares FormContext + SubComponents já foram criados (arsenal, elementos, acerto, ataque, defesa, testes, compendio, mestre, narrativa, perfil, status)
- MapaFormContext.js criado (falta SubComponents)
- Todos os arquivos estão no repositório e disponíveis como referência

**O que AINDA NÃO foi feito:**
- ❌ Nenhum dos 12 Panels foi refatorado — todos continuam monolíticos com lógica inline
- ❌ MapaSubComponents.jsx não foi criado
- ❌ PoderesFormContext.js + PoderesSubComponents.jsx não foram criados
- ❌ FichaFormContext.js + FichaSubComponents.jsx não foram criados
- ❌ AIFormContext.js + AISubComponents.jsx não foram criados

**Resumo:** Os FormContext/SubComponents existem como arquivos separados, mas os Panels ainda não os utilizam. O trabalho restante é: (1) criar os 4 pares faltantes, (2) refatorar todos os 12 Panels para usar Provider + SubComponents.

## Padrão Arquitetural (Seguir Exatamente)

### FormContext (exemplo: ArsenalFormContext.js)
```js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

// Constantes exportadas (tirar do Panel original)
export const ARMA_TIPOS = ['espada', 'arco', ...];

const ArsenalFormContext = createContext(null);

export function useArsenalForm() {
    const ctx = useContext(ArsenalFormContext);
    if (!ctx) return null;  // SEMPRE retornar null, nunca throw
    return ctx;
}

export function ArsenalFormProvider({ children }) {
    // Todo useState, useCallback, useMemo, useEffect que estava no Panel
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const [nomeItem, setNomeItem] = useState('');
    // ... restante do estado

    const salvarNovoItem = useCallback(() => {
        // lógica extraída do Panel
    }, [deps]);

    const value = useMemo(() => ({
        nomeItem, setNomeItem,
        salvarNovoItem,
        // ... tudo que os SubComponents precisam
    }), [deps]);

    return (
        <ArsenalFormContext.Provider value={value}>
            {children}
        </ArsenalFormContext.Provider>
    );
}
```

### SubComponents (exemplo: ArsenalSubComponents.jsx)
```jsx
import React from 'react';
import { useArsenalForm, ARMA_TIPOS, BONUS_OPTIONS } from './ArsenalFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Arsenal provider não encontrado</div>;

// Cada export é um componente focado e independente
export function ArsenalFormTitle() {
    const ctx = useArsenalForm();
    if (!ctx) return FALLBACK;
    const { itemEditandoId, nomeItem } = ctx;

    return (
        <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>
            {itemEditandoId ? `Editando: ${nomeItem}` : 'Forjar Novo Equipamento'}
        </h3>
    );
}

export function ArsenalNomeInput() {
    const ctx = useArsenalForm();
    if (!ctx) return FALLBACK;
    const { nomeItem, setNomeItem } = ctx;

    return (
        <input className="input-neon" type="text" placeholder="Nome" 
               value={nomeItem} onChange={e => setNomeItem(e.target.value)} />
    );
}
// ... mais componentes granulares
```

### Panel Refatorado (exemplo: como ArsenalPanel.jsx DEVE ficar)
```jsx
import React from 'react';
import { ArsenalFormProvider } from './ArsenalFormContext';
import { ArsenalFormTitle, ArsenalNomeInput, ArsenalTipoSelect, ... } from './ArsenalSubComponents';

export default function ArsenalPanel() {
    return (
        <ArsenalFormProvider>
            <div className="def-box">
                <ArsenalFormTitle />
                <ArsenalNomeInput />
                <ArsenalTipoSelect />
                {/* ... composição dos sub-componentes */}
            </div>
        </ArsenalFormProvider>
    );
}
```

## Regras Obrigatórias

1. **JavaScript puro (JSX)** — sem TypeScript
2. **Variáveis/funções em português** — `nomeItem`, `salvarFicha`, `editarElem`
3. **Zustand com selectors**: `useStore(s => s.campo)` — nunca `useStore()` sem selector
4. **Mutações via Immer**: `updateFicha(f => { f.campo = valor })`
5. **Firebase save com debounce**: usar `salvarFichaSilencioso()` — nunca save direto
6. **useCallback** para handlers, **useMemo** para cálculos e value do context
7. **CSS via classes** (`.btn-neon`, `.input-neon`, `.def-box`) — inline só para valores dinâmicos (cores calculadas, etc)
8. **Imports relativos** — sem aliases (`../../stores/useStore`)
9. **FALLBACK** em todo SubComponent — `if (!ctx) return FALLBACK;`
10. **Nunca** criar chaves Firebase sem `sanitizarNome()` (exportada de `stores/useStore.js`)

## Tarefas Específicas (em ordem de prioridade)

### Tarefa 1: Criar MapaSubComponents.jsx
- Ler `MapaPanel.jsx` e `MapaFormContext.js` (já existe)
- Extrair toda a UI do MapaPanel em sub-componentes granulares
- MapaPanel.jsx é o maior/mais complexo (~90KB) — tem modo 3D, cenários, iniciativa
- Sub-componentes sugeridos: MapaCenarioViewer, MapaGridControles, MapaIniciativaTracker, MapaTokenManager, MapaLayerControls, etc.

### Tarefa 2: Criar decomposição para PoderesPanel.jsx (72KB)
- Criar `PoderesFormContext.js` — extrair toda lógica/estado
- Criar `PoderesSubComponents.jsx` — UI granular
- Este é o segundo maior monolito do projeto

### Tarefa 3: Criar decomposição para FichaPanel.jsx (69KB)
- Criar `FichaFormContext.js`
- Criar `FichaSubComponents.jsx`
- Maior monolito em termos de funcionalidade

### Tarefa 4: Criar decomposição para AIPanel.jsx (28KB)
- Criar `AIFormContext.js`
- Criar `AISubComponents.jsx`
- Contém integração com Gemini API, gravação de áudio e histórico de chat

### Tarefa 5: Refatorar TODOS os Panels para usar Provider + SubComponents
Para cada Panel:
1. Substituir todo o corpo do componente por `<FeatureFormProvider>` + composição de SubComponents
2. Remover todos os `useState`, `useCallback`, `useMemo`, `useEffect` do Panel
3. Remover imports que agora vivem no FormContext
4. O Panel final deve ter ZERO lógica — só importa Provider + SubComponents e compõe

Panels a refatorar (12 — NENHUM foi refatorado ainda, todos continuam monolíticos):
- ArsenalPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- ElementosPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- AcertoPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- AtaquePanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- DefesaPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- TestesPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- CompendioPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- MapaPanel.jsx (FormContext JÁ EXISTE, SubComponents será criado na Tarefa 1)
- MestrePanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- NarrativaPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- PerfilPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)
- StatusPanel.jsx (FormContext + SubComponents JÁ EXISTEM, falta refatorar o Panel)

### Tarefa 6: Verificação
- Rodar `npm run dev` e testar TODAS as abas
- Garantir que nenhuma funcionalidade quebrou
- Rodar `npm test` (Vitest)

## Arquivos de Referência (já prontos, usar como modelo)

Para entender o padrão EXATO, leia estes arquivos já completos:
- `app/src/components/arsenal/ArsenalFormContext.js` — exemplo de FormContext completo
- `app/src/components/arsenal/ArsenalSubComponents.jsx` — exemplo de SubComponents granulares
- `app/src/components/arsenal/ElementosFormContext.js` — outro exemplo
- `app/src/components/arsenal/ElementosSubComponents.jsx` — outro exemplo
- `app/src/components/status/StatusFormContext.js` — exemplo com cálculos complexos
- `app/src/components/status/StatusSubComponents.jsx` — exemplo com SVG/radar

## Estrutura de Pastas
```
app/src/components/
  arsenal/    → ArsenalPanel, ArsenalFormContext✓, ArsenalSubComponents✓, ElementosPanel, ElementosFormContext✓, ElementosSubComponents✓
  combat/     → DummieToken.jsx (legado, ignorar)
  combate/    → AcertoPanel, AcertoFormContext✓, AcertoSubComponents✓, AtaquePanel, AtaqueFormContext✓, AtaqueSubComponents✓, DefesaPanel, DefesaFormContext✓, DefesaSubComponents✓, TestesPanel, TestesFormContext✓, TestesSubComponents✓
  compendio/  → CompendioPanel, CompendioFormContext✓, CompendioSubComponents✓
  feed/       → FeedPanel.jsx (feed de combate ao vivo — NÃO precisa decompor)
  ficha/      → FichaPanel (DECOMPOR — criar FormContext + SubComponents)
  ia/         → AIPanel, GravadorPanel (DECOMPOR — criar FormContext + SubComponents)
  jukebox/    → JukeboxPanel.jsx (player de música — NÃO precisa decompor)
  layout/     → AppShell.jsx, Sidebar.jsx (layout principal — NÃO precisa decompor)
  mapa/       → MapaPanel, MapaFormContext✓ (FALTA criar SubComponents)
  mestre/     → MestrePanel, MestreFormContext✓, MestreSubComponents✓
  narrativa/  → NarrativaPanel, NarrativaFormContext✓, NarrativaSubComponents✓
  oraculo/    → OraculoPanel.jsx (consulta IA — NÃO precisa decompor)
  perfil/     → PerfilPanel, PerfilFormContext✓, PerfilSubComponents✓
  poderes/    → PoderesPanel (DECOMPOR — criar FormContext + SubComponents)
  shared/     → Componentes compartilhados (NÃO precisa decompor)
  status/     → StatusPanel, StatusFormContext✓, StatusSubComponents✓
```
✓ = arquivo já existe mas o Panel correspondente AINDA NÃO foi refatorado para usá-lo

## Entregáveis Esperados
1. MapaSubComponents.jsx criado
2. PoderesFormContext.js + PoderesSubComponents.jsx criados
3. FichaFormContext.js + FichaSubComponents.jsx criados
4. AIFormContext.js + AISubComponents.jsx criados
5. Todos os 15 Panels refatorados para usar Provider + SubComponents
6. App funcional sem regressões
