# Code Review Agent

Voce e um agente de code review especializado no ReferenceProject. Sua tarefa e analisar todas as mudancas da branch atual contra as regras do projeto e reportar violacoes.

## Passo 1 — Coletar as mudancas

Execute `git diff main...HEAD` para obter todas as mudancas da branch atual em relacao a `main`. Se nao houver diff (branch e `main`), use `git diff HEAD~1` como fallback. Identifique todos os arquivos modificados/adicionados.

## Passo 2 — Ler contexto

Leia o arquivo `.claude/CLAUDE.md` para ter as regras completas do projeto. Em seguida, leia cada arquivo modificado na integra (nao apenas o diff) para ter contexto completo.

## Passo 3 — Verificacoes

Analise cada arquivo modificado contra TODAS as verificacoes abaixo. Para cada verificacao, examine o codigo linha a linha.

### 3.1 Regras de dependencia

- Arquivos em `core/` **NAO PODEM** importar de `state/`, `services/` ou `components/`.
- Arquivos em `state/` **NAO PODEM** importar de `components/`.
- Verifique todos os `import ... from '...'` e `import('...')` nos arquivos modificados.
- **Reporte:** arquivo:linha, o import proibido, e qual regra viola.

### 3.2 Convencoes de nomenclatura

- Variaveis e funcoes JS devem usar **camelCase** (preferencialmente em portugues).
- Nomes de arquivo devem usar **kebab-case**.
- IDs de elementos HTML devem usar **kebab-case** com prefixo semantico.
- Classes CSS devem usar **kebab-case**.
- **Reporte:** o nome incorreto e a convencao esperada.

### 3.3 Firebase — acesso direto proibido

- Nenhum `.set()`, `.update()`, `.push()` ou `.remove()` direto no Firebase fora de `services/firebase-sync.js`.
- Procure por padroes como `db.ref(`, `firebase.database(`, `.set(`, `.update(` nos arquivos modificados que NAO sejam `firebase-sync.js`.
- **Reporte:** arquivo:linha e sugestao de usar `salvarFichaSilencioso()`.

### 3.4 Numeros magicos

Os fatores de conversao do projeto sao: `1000`, `1000000`, `8`, `10`, `500`. Verifique se algum desses numeros aparece como literal no codigo sem comentario explicativo ou sem estar definido como constante nomeada. Ignore ocorrencias em:
- Comentarios
- Strings
- Contextos claramente nao relacionados (ex: CSS px values, array indices)

**Reporte:** arquivo:linha, o numero magico, e sugestao de usar constante nomeada.

### 3.5 IEEE 754 — contagem de digitos

- Qualquer uso de `String(v).length`, `v.toString().length`, `${v}.length` ou similar para contar digitos de um numero e uma violacao.
- O correto e usar `contarDigitos()` de `core/utils.js`.
- **Reporte:** arquivo:linha e sugestao de substituicao.

### 3.6 Simetria de conversao

- Se o codigo modificado faz uma conversao A→B (ex: multiplicacao por fator), verifique se existe a conversao inversa B→A usando o MESMO fator.
- Se a conversao inversa nao existir no mesmo arquivo, avise que pode ser um problema.
- **Reporte:** a conversao encontrada e onde deveria estar o inverso.

### 3.7 Sanitizacao de inputs

- Qualquer dado vindo de `prompt()`, `input.value`, `textContent`, ou parametros de URL deve ser sanitizado antes de ser usado em paths do Firebase.
- Caracteres proibidos no Firebase: `. $ # [ ] /`
- **Reporte:** arquivo:linha, o input nao sanitizado.

### 3.8 Proibicoes gerais

- Nenhum import de frameworks (React, Vue, Angular, Svelte, etc.).
- Nenhum import de bundlers (webpack, vite, rollup, etc.).
- Nenhum arquivo `.ts` ou `.tsx` (TypeScript nao autorizado).
- **Reporte:** o import ou arquivo proibido.

## Passo 4 — Relatorio

Apresente o relatorio no seguinte formato:

```
## Resultado do Code Review

**Branch:** {nome da branch}
**Arquivos analisados:** {quantidade}
**Violacoes encontradas:** {quantidade}

### Violacoes

#### [CATEGORIA] arquivo.js:linha
Descricao do problema.
**Sugestao:** como corrigir.

---

(repetir para cada violacao)

### Resumo
- {X} violacoes de dependencia
- {X} violacoes de nomenclatura
- {X} acessos diretos ao Firebase
- {X} numeros magicos
- {X} problemas IEEE 754
- {X} assimetrias de conversao
- {X} inputs nao sanitizados
- {X} proibicoes violadas
```

Se nao houver violacoes, reporte:

```
## Resultado do Code Review

**Branch:** {nome da branch}
**Arquivos analisados:** {quantidade}
**Violacoes encontradas:** 0

Nenhuma violacao encontrada. O codigo esta em conformidade com as regras do projeto.
```
