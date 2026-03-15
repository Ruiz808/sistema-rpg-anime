# AI_RULES.md — Instruções para IA no ReferenceProject

> Este documento é a fonte autoritativa de regras para qualquer IA que interaja com este codebase.
> Todas as instruções são imperativas e devem ser seguidas sem exceção.

---

## 1. Stack e Padrões Arquiteturais

### Stack

- **Frontend:** HTML / CSS / JavaScript vanilla (ES modules nativos)
- **Backend:** Firebase Realtime Database
- **Hosting:** Firebase Hosting (deploy automático via GitHub Actions)
- **Desktop:** Tauri (build nativo em `src-tauri/`)

### Camadas do Sistema

```
core/        → Lógica pura (cálculos, utilitários). Sem side effects.
state/       → Store global (fonte única da verdade). Sem dependências de core ou components.
services/    → I/O externo (Firebase, localStorage). Depende de state.
components/  → UI e manipulação do DOM. Consome core, state e services.
app.js       → Bootstrap: importa módulos, inicializa listeners, expõe no window.
```

### Regras de Dependência

- `core/` **NUNCA** importa de `state/`, `services/` ou `components/`.
- `state/` **NUNCA** importa de `components/`.
- `components/` podem importar de `core/`, `state/` e `services/`.
- `services/` podem importar de `state/` e `core/`.
- Todas as importações usam **caminhos relativos** com extensão `.js` explícita.

### Proibições

- **NÃO** introduzir frameworks (React, Vue, Angular, etc.).
- **NÃO** introduzir bundlers (Webpack, Vite, Rollup, etc.).
- **NÃO** converter para TypeScript sem autorização explícita do usuário.
- Todo código deve funcionar como **ES modules nativos** no navegador.

---

## 2. Regras de Código

### Nomenclatura

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Variáveis e funções JS | camelCase (português) | `minhaFicha`, `calcularDano()`, `salvarFichaSilencioso()` |
| Nomes de arquivo | kebab-case | `firebase-sync.js`, `firebase-config.js` |
| IDs de elementos HTML | kebab-case com prefixo semântico | `sel-atributo`, `atk-dados`, `novo-pod-nome` |
| Classes CSS | kebab-case | `btn-neon`, `badge-elem` |
| Paths no Firebase | snake_case / nomes diretos | `personagens/{nome}`, `feed_combate` |

### Linguagem do Domínio

Todo o código de domínio (funções, variáveis, comentários) deve usar **português**. Nomes técnicos em inglês são aceitáveis quando são termos padrão (e.g., `export`, `import`, `debounce`).

### Fatores de Conversão — Regra Anti-Bug

**PROIBIDO** espalhar literais mágicos de conversão pelo código. Os fatores atuais são:

| Fator | Uso |
|-------|-----|
| `1000` | Divisor de prestígio para atributos físicos |
| `1000000` | Divisor de prestígio para pools de energia (vida, mana, aura, chakra, corpo) |
| `8` | Quantidade de atributos físicos (média) |
| `8` | Limiar de dígitos para letalidade (`contarDigitos(total) - 8`) |
| `10` | Base da potência para redução de letalidade (`Math.pow(10, letalidade)`) |
| `500` | Debounce em ms para salvamento silencioso |

**Regra de simetria:** Toda conversão A→B **DEVE** ter inverso B→A usando o **mesmo fator**. Se um cálculo multiplica por X, o cálculo reverso divide por X — nunca usar fatores diferentes para ida e volta.

### Números Grandes e IEEE 754

- **SEMPRE** usar `contarDigitos(v)` (de `core/utils.js`) para contar dígitos de números.
- **NUNCA** usar `String(v).length` ou `v.toString().length` — falha com notação científica (e.g., `1.23e+21` retorna 8 caracteres, não 22 dígitos).
- `contarDigitos()` usa `Math.floor(Math.log10(v)) + 1`, que é correto para qualquer magnitude.

### Funções Puras em `core/`

Toda função em `core/` deve:
- Receber dados como parâmetros explícitos.
- Retornar valores sem mutar estado externo.
- Não acessar DOM, Firebase, ou variáveis globais.

### Estado Global via `state/store.js`

- A ficha do personagem vive em `minhaFicha` (exportada como live binding via `let`).
- Mutações diretas em propriedades de `minhaFicha` são permitidas (e.g., `minhaFicha.forca.base = 10`).
- Para **reatribuir** a variável inteira, usar os setters: `setMinhaFicha(f)`, `setMeuNome(n)`, etc.
- Após qualquer mutação, chamar `salvarFichaSilencioso()` para persistir.

---

## 3. Padrão Firebase

### Estrutura do Banco

```
personagens/
  {nome}/              → Ficha completa do personagem (objeto fichaPadrao)
feed_combate/          → Log de ações de combate (push de entradas)
```

### Regras de Acesso

- Cada jogador edita **apenas** seu próprio personagem (`personagens/{meuNome}`).
- O mestre (`isMestre`) pode visualizar fichas de outros jogadores, mas a edição segue a mesma regra.

### Salvamento

- **SEMPRE** usar `salvarFichaSilencioso()` de `services/firebase-sync.js` para salvar.
- **NUNCA** chamar `db.ref().set()` diretamente fora de `firebase-sync.js`.
- **NUNCA** fazer `.set()` parcial (sobrescrevendo apenas parte da ficha) — sempre salvar a ficha completa via `minhaFicha`.
- O salvamento é **debounced** (500ms): múltiplas mudanças rápidas geram apenas uma escrita.

### Listeners

- `iniciarListenerPersonagens(callback)` — escuta mudanças em todos os personagens.
- `iniciarListenerFeed(callback)` — escuta novas entradas no feed de combate.
- Listeners são inicializados uma vez em `app.js` durante o bootstrap.

### Fallback Offline

- `localStorage` é usado como backup:
  - `rpgFicha_{nome}` — backup da ficha do personagem.
  - `rpgNome` — nome do jogador.
  - `rpgIsMestre` — flag de modo mestre.
- Se o Firebase falhar na carga, a ficha é recuperada do localStorage.

---

## 4. Convenção de Git e Branches

### Branches

| Prefixo | Uso |
|---------|-----|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `refactor/` | Refatoração sem mudança de comportamento |
| `ci/` | Alterações em CI/CD, deploy, configuração |

### Commits

- Mensagens em **português**.
- Formato: `tipo: descrição concisa`
  - Exemplos: `feat: adicionar sistema de elementos`, `fix: corrigir cálculo de dano`
- **PROIBIDO** commit direto na branch `main`.
- **OBRIGATÓRIO** fazer `git push` após cada commit — nunca deixar commits apenas locais.

### Fluxo

1. Criar branch a partir de `main` com prefixo adequado.
2. Commitar com mensagem no formato acima.
3. Fazer push imediatamente após cada commit.
4. Abrir PR para merge na `main`.
