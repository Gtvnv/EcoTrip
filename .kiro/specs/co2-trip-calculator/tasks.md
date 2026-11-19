# Implementation Plan: EcoTrip (co2-trip-calculator)

## Overview

A implementação segue a ordem de construção definida no design: `index.html`, `style.css`, `rotas.js` e `config.js`, `calculator.js`, `ui.js`, `app.js`. Depois vêm os testes automatizados (fast-check com `node --test`), o workflow de deploy e o README. A linguagem é JavaScript puro, sem framework nem biblioteca de terceiros na página. Cada etapa se liga à anterior, e o `app.js` conecta tudo ao final.

## Tasks

- [x] 1. Criar a estrutura HTML da página
  - [x] 1.1 Criar `index.html` semântico
    - Um `header`, um `main` com quatro `section` (formulário, resultado, comparação, créditos) e um `footer`
    - Campos de origem e destino com `label for` visível, lista de sugestões (`role="listbox"`) e região `role="alert"` adjacente a cada campo
    - Campo numérico de distância manual (`step="0.01" min="0"`) e `fieldset` com quatro `input type="radio"` de modal, nenhum marcado
    - Botão de cálculo; as seções de resultado, comparação e créditos com o atributo `hidden`
    - Classes em BEM minúsculo com hífens (ex.: `formulario__campo`, `sugestoes__item--destacado`)
    - Scripts carregados na ordem `rotas.js`, `config.js`, `calculator.js`, `ui.js`, `app.js`, sem nenhuma biblioteca de terceiros
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.6, 5.1, 10.1, 10.5, 11.1_

- [x] 2. Criar o estilo
  - [x] 2.1 Criar `style.css` com paleta em variáveis CSS
    - Todas as cores como variáveis no `:root` (`--cor-fundo`, `--cor-texto`, `--cor-primaria`, `--cor-erro` etc.) e só `var(...)` no restante, sem cor literal fora do `:root`
    - Classes BEM em minúsculo, correspondentes às usadas no `index.html`
    - `:focus-visible` com contorno visível; pares de cor com contraste de pelo menos 4,5:1 (texto normal) e 3:1 (texto grande), inclusive no erro
    - Layout fluido (flex/grid, `max-width`, `overflow-wrap: anywhere`) de 320 px a 1920 px, sem rolagem horizontal, sobreposição ou truncamento
    - Estilo das barras de comparação, da lista de sugestões e do atributo `hidden`
    - _Requirements: 1.3, 1.4, 11.4, 11.5, 11.6_

- [x] 3. Criar a base de rotas e a configuração
  - [x] 3.1 Criar `rotas.js` com `Base_de_Rotas`
    - Definir `cidades` e `distancias` (`{ origem, destino, km }`), com cada par uma só vez
    - Cada `km` em (0, 10000] com no máximo 1 casa decimal; sem chave de API
    - Expor `Base_de_Rotas` em `window` e, no final do arquivo, `if (typeof module !== "undefined") module.exports = ...`
    - _Requirements: 3.1, 3.6, 10.2_

  - [x] 3.2 Criar `config.js` com `Configuracao`
    - `fatoresEmissao` (g/km) para bicicleta, carro, ônibus e caminhão e `precoCredito` (R$ por tonelada de CO2, até 2 casas)
    - Comentário adjacente a cada valor com a unidade e a fonte (nome e ano)
    - Expor `Configuracao` em `window` e exportar para Node
    - _Requirements: 9.1, 9.2, 9.4, 10.2_

- [x] 4. Implementar a Calculadora
  - [x] 4.1 Criar `calculator.js`: erros, validações, distância e formatação
    - Classe `ErroCalculadora` (com `parametro` e `codigo`) e constantes `MODAIS`, `DISTANCIA_MAXIMA_KM`, `MIN_CARACTERES_BUSCA`, `MAX_SUGESTOES`
    - `validarConfiguracao(config = Configuracao)`, `obterDistancia(origem, destino)` (Funcao_de_Distancia, busca simétrica, `ROTA_NAO_ENCONTRADA`), `validarDistanciaManual` (`DISTANCIA_INVALIDA` e `DISTANCIA_MAXIMA`) e `resolverDistancia` (manual prevalece)
    - `arredondarMeioParaCima`, `formatarNumero` (pt-BR manual, sem `Intl`), `formatarEmissao`, `formatarDistancia`, `formatarCreditos`, `formatarCusto`
    - `normalizarTexto` e `filtrarCidades` (mínimo de 2 caracteres, até 10 resultados, ordem alfabética, sem diferenciar maiúsculas e acentos)
    - Funções recebem `Configuracao` e `Base_de_Rotas` como parâmetro opcional, com os globais como padrão; nenhuma referência a `document`; exportar para Node
    - _Requirements: 2.1, 2.2, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 5.5, 6.4, 8.3, 9.3, 9.5, 10.3, 10.6_

  - [x] 4.2 Acrescentar a `calculator.js`: emissão, comparação e compensação
    - `calcularEmissao(distanciaKm, modal)` = `distanciaKm * fator / 1000`, validando distância em (0, 20000] e fator definido, numérico e ≥ 0 (fator 0 é válido)
    - `compararModais(distanciaKm)` com ordenação crescente e desempate pela ordem original, `larguraPct`, `diferencaPct` (`null` para emissão 0) e `semEmissao`, sem divisão por zero
    - `calcularCreditos`, `calcularCustoCompensacao` e `calcularCompensacao` (devolve `creditos` e `erroPreco` quando o preço é inválido)
    - Expor `Calculadora` em `window`
    - _Requirements: 6.2, 6.3, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.6, 8.7, 8.8, 9.6, 10.2, 10.4_

- [x] 5. Checkpoint - Verificar a Calculadora
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar a Interface
  - [x] 6.1 Criar `ui.js`: autocomplete e leitura do formulário
    - `inicializar()` (mantém as três seções ocultas), `lerFormulario()`
    - `exibirSugestoes` / `fecharSugestoes` com "Nenhuma cidade encontrada" como item não selecionável
    - `tratarTecladoAutocomplete`: setas movem o destaque (`aria-activedescendant`), Enter seleciona, Esc fecha sem alterar o texto; clique e Enter preenchem o campo, fecham a lista e mantêm o foco
    - Sugestões exibidas em até 200 ms após a digitação
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 11.4_

  - [x] 6.2 Acrescentar a `ui.js`: erros e seções de resultado
    - `exibirErro(campo, mensagem)` / `limparErro(campo)`: uma única mensagem por campo (até 120 caracteres), em região `role="alert"` adjacente, substituindo a anterior
    - `exibirResultado`, `exibirComparacao` (barras com `style.width`, percentuais, mensagem de "sem emissão a comparar"), `exibirCreditos` (aviso de estimativa com o preço usado, mensagens de emissão zero e de erro) e `ocultarResultados`
    - Valores formatados com as funções de formatação da Calculadora
    - Expor `Interface` em `window`
    - _Requirements: 5.3, 5.4, 6.1, 6.4, 6.6, 7.1, 7.3, 7.4, 7.6, 7.7, 7.8, 8.3, 8.4, 8.5, 8.7, 8.8, 10.2, 11.1, 11.2, 11.3_

- [x] 7. Conectar tudo na Aplicacao
  - [x] 7.1 Criar `app.js`
    - `iniciar()` em `DOMContentLoaded`: executa `validarConfiguracao`; em caso de erro, mostra o item inválido e desabilita o botão; senão chama `Interface.inicializar()` e registra os eventos
    - `validarFormulario(dados)` e `aoCalcular(evento)` aplicando as regras na ordem do design e coletando todos os erros juntos (sem modal; distância manual; origem ou destino vazios; origem igual ao destino sem chamar `obterDistancia`; rota inexistente com orientação), preservando os valores digitados
    - Com sucesso, exibir as três seções em até 1 segundo; com erro, manter as seções ocultas; `try/catch` com `console.error` para erros inesperados
    - `aoAlterarDistanciaManual()` reavalia a distância e atualiza ou oculta os resultados em até 1 segundo, sem recarregar a página
    - Expor `Aplicacao` em `window`
    - _Requirements: 3.4, 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.3, 5.4, 5.5, 5.6, 9.5, 10.2, 11.1_

- [x] 8. Checkpoint - Verificar a página completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Testes automatizados
  - [x] 9.1 Configurar o ambiente de testes
    - Criar `package.json` (somente desenvolvimento) com `fast-check` como devDependency e o script `"test": "node --test tests/"`
    - Os arquivos de `tests/` não são carregados pela página nem publicados
    - _Requirements: 1.5, 10.1_

  - [x] 9.2 Escrever teste de propriedade para o cálculo da emissão
    - **Property 1: Emissão é distância vezes fator dividido por 1000**
    - Arquivo `tests/propriedade-01.test.js`, com 100 ou mais iterações e o comentário `Feature: co2-trip-calculator, Property 1`
    - **Validates: Requirements 6.2, 6.3, 6.5, 6.7, 9.6**

  - [x] 9.3 Escrever teste de propriedade para entradas inválidas
    - **Property 2: Entradas inválidas são rejeitadas com identificação do parâmetro**
    - Arquivo `tests/propriedade-02.test.js`
    - **Validates: Requirements 6.6, 8.7, 8.8, 10.6**

  - [x] 9.4 Escrever teste de propriedade para a validação da configuração
    - **Property 3: Validação da configuração**
    - Arquivo `tests/propriedade-03.test.js`
    - **Validates: Requirements 9.1, 9.2, 9.5**

  - [x] 9.5 Escrever teste de propriedade para a distância de rotas cadastradas
    - **Property 4: Distância de rota cadastrada é a registrada e simétrica**
    - Arquivo `tests/propriedade-04.test.js`
    - **Validates: Requirements 3.2, 3.3**

  - [x] 9.6 Escrever teste de propriedade para rota inexistente
    - **Property 5: Rota inexistente sinaliza erro**
    - Arquivo `tests/propriedade-05.test.js`
    - **Validates: Requirements 3.4**

  - [x] 9.7 Escrever teste de propriedade para os dados da Base_de_Rotas
    - **Property 6: Dados da Base_de_Rotas são válidos**
    - Arquivo `tests/propriedade-06.test.js`
    - **Validates: Requirements 3.1**

  - [x] 9.8 Escrever teste de propriedade para a distância manual
    - **Property 7: Validação da distância manual**
    - Arquivo `tests/propriedade-07.test.js`
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 9.9 Escrever teste de propriedade para a prevalência da distância manual
    - **Property 8: Distância manual válida prevalece sobre a base**
    - Arquivo `tests/propriedade-08.test.js`
    - **Validates: Requirements 5.5**

  - [x] 9.10 Escrever teste de propriedade para créditos e custo
    - **Property 9: Créditos e custo são proporcionais à emissão**
    - Arquivo `tests/propriedade-09.test.js`
    - **Validates: Requirements 8.1, 8.2, 8.6**

  - [x] 9.11 Escrever teste de propriedade para formatação e arredondamento
    - **Property 10: Formatação pt-BR e arredondamento meio para cima**
    - Arquivo `tests/propriedade-10.test.js`
    - **Validates: Requirements 6.4, 8.3**

  - [x] 9.12 Escrever teste de propriedade para a comparação de modais
    - **Property 11: Comparação completa, ordenada e consistente**
    - Arquivo `tests/propriedade-11.test.js`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

  - [x] 9.13 Escrever teste de propriedade para a diferença percentual
    - **Property 12: Diferença percentual em relação à menor emissão não nula**
    - Arquivo `tests/propriedade-12.test.js`
    - **Validates: Requirements 7.5, 7.6, 7.7**

  - [x] 9.14 Escrever teste de propriedade para o filtro de autocomplete
    - **Property 13: Filtro de autocomplete**
    - Arquivo `tests/propriedade-13.test.js`
    - **Validates: Requirements 2.1, 2.2**

  - [x] 9.15 Escrever testes unitários da Calculadora
    - Arquivo `tests/calculadora.test.js`: cálculo conhecido de 100 km de carro (emissão, créditos e custo), bicicleta com 0,00 kg / 0,0000 / R$ 0,00, 123,45 kg exibindo 0,1235 créditos, distância `1.234,5`
    - Preço inválido mantendo os créditos (`erroPreco`) e chamadas da Calculadora retornando em menos de 100 ms
    - _Requirements: 6.3, 6.4, 8.3, 8.4, 8.7, 10.4_

  - [x] 9.16 Escrever testes unitários da Interface e da Aplicacao
    - Arquivo `tests/interface.test.js`, com DOM simulado (`jsdom`, devDependency) ou verificação manual: origem igual ao destino sem chamar `obterDistancia`, sem modal e sem distância exibindo as duas mensagens, "Nenhuma cidade encontrada" não selecionável, setas, Enter e Esc, uma mensagem por campo substituída ao revalidar e com até 120 caracteres
    - _Requirements: 2.3, 2.4, 2.5, 3.7, 5.6, 11.1, 11.2, 11.3_

  - [x] 9.17 Escrever testes de fumaça e verificações estáticas
    - Arquivo `tests/fumaca.test.js`: estrutura do `index.html` (um `header`, `main`, `footer`, quatro `section`, ordem dos scripts, seções ocultas), nenhuma cor literal fora do `:root` e classes BEM em `style.css`, ausência de `document` em `calculator.js`, comentários de unidade e fonte em `config.js`, regras do `.gitignore`, ausência de chaves de API, `typeof` dos cinco globais igual a `"object"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.6, 9.3, 9.4, 10.2, 10.3, 10.5, 12.7_

- [x] 10. Publicação e proteção do repositório
  - [x] 10.1 Criar `.github/workflows/deploy.yml`
    - Gatilhos `push` na branch de publicação e `workflow_dispatch`; permissões `contents: read`, `pages: write`, `id-token: write`; `concurrency: { group: pages, cancel-in-progress: false }`; `timeout-minutes: 10`
    - Etapas: `actions/checkout`, montagem da pasta `_site` com somente os 7 arquivos da aplicação, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`
    - _Requirements: 12.2, 12.3, 12.4_

  - [x] 10.2 Criar `.gitignore`
    - Incluir `.env`, `.env.*`, `*.pem`, `*.key`, `credentials*.json` e `node_modules/`
    - _Requirements: 12.7_

- [x] 11. Documentação
  - [x] 11.1 Criar `README.md`
    - Visão geral com no máximo 150 palavras e lista numerada de uso (origem, destino, modal e leitura do resultado)
    - Explicação do cálculo (distância, Fator_de_Emissao, Credito_de_Carbono, Custo_de_Compensacao) com fórmulas e um exemplo numérico conferido com `calculator.js` e `config.js`
    - Ordem de construção em exatamente seis itens: index.html, style.css, Base_de_Rotas e config.js, calculator.js, ui.js, app.js
    - Ao menos um prompt que funcionou bem, com a etapa da construção a que se refere
    - URL publicada começando com `https://`; captura de tela com texto alternativo descritivo, se o arquivo existir
    - Exatamente cinco ideias futuras: mais cidades, destaque do modal selecionado, soma de várias viagens, API de mapas e back-end em Python
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 12. Checkpoint final - Verificar tudo
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada task referencia requisitos específicos para rastreabilidade.
- Os testes de propriedade validam as propriedades universais do design; os testes unitários e de fumaça cobrem exemplos e casos de borda. A `Interface`, o HTML/CSS e o deploy são verificados por exemplos, verificações estáticas e inspeção manual (acessibilidade, contraste, responsividade e execução real do workflow).
- Os arquivos de `tests/` e o `package.json` são só de desenvolvimento e não entram no artefato publicado.
- Git: o repositório novo e pessoal em github.com/Gtvnv pode receber commit e push direto na `main`, sem `push --force` nem reescrita de histórico. Se o repositório for de outra conta ou deixar de ser um projeto pessoal novo, o trabalho vai em branch (`feature/...`) com Pull Request revisado por um humano. Adicione arquivos por nome, sem `git add .`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "3.2", "10.2"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["4.2", "6.1"] },
    { "id": 3, "tasks": ["6.2"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["9.1", "10.1", "11.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "9.10", "9.11", "9.12", "9.13", "9.14", "9.15", "9.16", "9.17"] }
  ]
}
```
