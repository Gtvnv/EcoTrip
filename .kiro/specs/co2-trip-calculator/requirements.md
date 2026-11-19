# Requirements Document

## Introduction

A EcoTrip é uma aplicação web estática, escrita em HTML, CSS e JavaScript puros (sem framework), que calcula a emissão de CO2 de uma viagem e o custo estimado para compensá-la com créditos de carbono. A aplicação compara quatro modais de transporte: bicicleta, carro, ônibus e caminhão.

As rotas são simuladas: um arquivo de dados faz o papel de back-end, com distâncias entre cidades brasileiras. O cálculo de distância fica isolado em uma única função, para que possa ser trocado no futuro (por exemplo, por uma API de mapas) sem alterar o restante do código. O projeto é publicado em um repositório público no GitHub, com deploy no GitHub Pages via GitHub Actions.

Fora de escopo (ideias futuras): mais cidades, destaque do modal selecionado, soma de várias viagens, API de mapas e back-end em Python.

## Glossary

- **EcoTrip**: A aplicação web completa descrita neste documento.
- **Interface**: Camada de apresentação (ui.js) que lê entradas, atualiza o DOM e exibe seções.
- **Calculadora**: Módulo (calculator.js) que realiza os cálculos de distância, emissão, comparação e custo de compensação.
- **Aplicacao**: Módulo (app.js) que conecta a Interface à Calculadora e trata os eventos.
- **Base_de_Rotas**: Arquivo de dados que simula o back-end, com distâncias em km entre pares de cidades brasileiras.
- **Configuracao**: Módulo (config.js) com os fatores de emissão por modal e o preço do crédito de carbono.
- **Funcao_de_Distancia**: Única função da Calculadora responsável por obter a distância em km de uma viagem a partir de origem e destino.
- **Modal**: Meio de transporte: bicicleta, carro, ônibus ou caminhão.
- **Fator_de_Emissao**: Quantidade de CO2, em gramas, emitida por quilômetro percorrido por um Modal.
- **Emissao**: Quantidade total de CO2 de uma viagem, em quilogramas, igual à distância multiplicada pelo Fator_de_Emissao do Modal.
- **Credito_de_Carbono**: Unidade que compensa 1 tonelada (1000 kg) de CO2.
- **Preco_do_Credito**: Valor em reais (BRL) de 1 Credito_de_Carbono, definido na Configuracao.
- **Custo_de_Compensacao**: Valor estimado em reais para compensar a Emissao de um Modal.
- **Distancia_Manual**: Distância em km informada diretamente pelo usuário.
- **Secao_Resultado**: Seção da página que exibe distância e Emissao da viagem.
- **Secao_Comparacao**: Seção da página que compara a Emissao dos quatro Modais.
- **Secao_Creditos**: Seção da página que exibe os créditos necessários e o Custo_de_Compensacao.
- **Repositorio**: Repositório público do projeto no GitHub, com nome em minúsculas e sem acentos.
- **Pipeline_de_Deploy**: Workflow do GitHub Actions em .github/workflows que publica o EcoTrip no GitHub Pages.

## Requirements

### Requirement 1: Estrutura semântica da página

**User Story:** Como usuário, quero uma página clara e organizada, para que eu entenda onde informar a viagem e onde ver os resultados.

#### Acceptance Criteria

1. THE EcoTrip SHALL fornecer uma página index.html contendo exatamente um elemento header, um elemento main e um elemento footer, e dentro do main uma section para o formulário, uma section para o resultado, uma section para a comparação e uma section para os créditos.
2. WHEN a página é carregada, THE Interface SHALL manter a Secao_Resultado, a Secao_Comparacao e a Secao_Creditos ocultas, de modo que nenhum dos três elementos seja exibido na tela nem exposto a leitores de tela, e a seção do formulário permaneça visível.
3. THE EcoTrip SHALL aplicar o estilo por meio do arquivo style.css referenciado em index.html, com cada cor da paleta definida como variável CSS no seletor :root e nenhum valor de cor literal (hexadecimal, rgb ou hsl) fora das declarações dessas variáveis.
4. THE EcoTrip SHALL nomear 100% das classes CSS usadas em index.html e style.css segundo a convenção BEM (bloco__elemento--modificador), em minúsculas com palavras separadas por hífen.
5. THE EcoTrip SHALL funcionar usando apenas HTML, CSS e JavaScript puros, sem carregar nenhum framework ou biblioteca JavaScript ou CSS de terceiros.
6. IF o arquivo style.css não puder ser carregado, THEN THE EcoTrip SHALL manter todo o conteúdo de index.html presente e legível na ordem do documento, sem perda de texto ou de campos do formulário.

### Requirement 2: Autocomplete de origem e destino

**User Story:** Como usuário, quero digitar origem e destino com sugestões, para que eu selecione cidades rapidamente sem erros de grafia.

#### Acceptance Criteria

1. WHEN o usuário digita ao menos 2 caracteres no campo de origem ou de destino, THE Interface SHALL exibir em até 200 ms, em ordem alfabética, no máximo 10 cidades da Base_de_Rotas cujo nome contém o texto digitado, sem diferenciar maiúsculas, minúsculas ou acentos.
2. WHEN o usuário digita menos de 2 caracteres no campo de origem ou de destino, THE Interface SHALL manter a lista de sugestões fechada.
3. WHEN o usuário seleciona uma sugestão por clique ou pela tecla Enter, THE Interface SHALL preencher o campo correspondente com o nome completo da cidade, fechar a lista de sugestões e manter o foco no campo.
4. IF nenhuma cidade da Base_de_Rotas corresponde ao texto digitado, THEN THE Interface SHALL exibir a mensagem "Nenhuma cidade encontrada" na lista de sugestões, sem permitir a seleção dessa mensagem como valor do campo.
5. WHILE a lista de sugestões está aberta, THE Interface SHALL permitir ao usuário mover o destaque entre as sugestões com as teclas seta para cima e seta para baixo, selecionar a sugestão destacada com Enter e fechar a lista com Esc sem alterar o texto digitado.
6. THE Interface SHALL associar um rótulo acessível (label) visível e programaticamente vinculado a cada um dos campos de origem e de destino, de modo que leitores de tela anunciem o rótulo ao receber o foco.

### Requirement 3: Distância pela base de rotas

**User Story:** Como usuário, quero que a distância entre as cidades seja obtida automaticamente, para que eu não precise pesquisá-la.

#### Acceptance Criteria

1. THE Base_de_Rotas SHALL conter, para cada par de cidades cadastrado, uma distância rodoviária em km, expressa como número maior que 0 e menor ou igual a 10.000, com no máximo 1 casa decimal.
2. WHEN a Funcao_de_Distancia recebe uma origem e um destino que formam um par cadastrado na Base_de_Rotas, THE Funcao_de_Distancia SHALL retornar a distância em km registrada para esse par.
3. WHEN origem e destino formam um par cadastrado na Base_de_Rotas, THE Funcao_de_Distancia SHALL retornar o mesmo valor de distância para as ordens (origem, destino) e (destino, origem).
4. IF o par de cidades não existe na Base_de_Rotas, THEN THE Funcao_de_Distancia SHALL sinalizar que a rota não foi encontrada, sem retornar um valor de distância, e THE Interface SHALL exibir uma mensagem indicando que a rota não foi encontrada e manter os dados já informados pelo usuário.
5. THE Calculadora SHALL obter a distância de uma viagem exclusivamente por meio da Funcao_de_Distancia, de modo que a troca por outra fonte (como uma API de mapas) altere somente essa função.
6. THE EcoTrip SHALL manter qualquer chave de API fora do código versionado.
7. IF origem e destino são a mesma cidade, THEN THE Interface SHALL exibir a mensagem "Origem e destino devem ser diferentes", não invocar a Funcao_de_Distancia e não exibir resultado de cálculo.

### Requirement 4: Distância manual

**User Story:** Como usuário, quero informar a distância manualmente, para que eu calcule viagens cuja rota não está na base.

#### Acceptance Criteria

1. THE Interface SHALL oferecer um campo numérico para a Distancia_Manual em km, aceitando valores com até 2 casas decimais.
2. WHEN o usuário informa uma Distancia_Manual maior que 0 e menor ou igual a 20000 km, THE Aplicacao SHALL usar esse valor no cálculo em vez da Base_de_Rotas, SHALL exibir as seções de resultado e SHALL ocultar a mensagem de erro de distância, se houver.
3. IF a Distancia_Manual é vazia, zero, negativa ou não numérica, THEN THE Interface SHALL exibir a mensagem "Informe uma distância válida em km", SHALL manter as seções de resultado ocultas e SHALL preservar os demais valores já preenchidos no formulário.
4. IF a Distancia_Manual excede 20000 km, THEN THE Interface SHALL exibir a mensagem "A distância máxima é 20000 km", SHALL manter as seções de resultado ocultas e SHALL preservar o valor digitado no campo.
5. WHEN a rota informada não está na Base_de_Rotas e nenhuma Distancia_Manual válida foi informada, THE Interface SHALL exibir uma orientação para informar a Distancia_Manual, SHALL manter as seções de resultado ocultas e SHALL manter o campo de Distancia_Manual visível e habilitado.
6. WHEN o usuário altera ou apaga a Distancia_Manual, THE Aplicacao SHALL reavaliar a distância e atualizar ou ocultar os resultados em até 1 segundo, sem recarregar a página.

### Requirement 5: Seleção do modal e disparo do cálculo

**User Story:** Como usuário, quero escolher o modal da viagem e calcular, para que eu veja o impacto da minha escolha.

#### Acceptance Criteria

1. THE Interface SHALL oferecer a escolha de exatamente um entre quatro Modais: bicicleta, carro, ônibus e caminhão, sendo que nenhum Modal vem pré-selecionado ao carregar a página.
2. WHEN o usuário aciona o botão de cálculo com uma distância válida e um Modal selecionado, THE Aplicacao SHALL calcular o resultado e exibir a Secao_Resultado, a Secao_Comparacao e a Secao_Creditos em até 1 segundo após o acionamento.
3. IF nenhum Modal está selecionado quando o usuário aciona o botão de cálculo, THEN THE Interface SHALL exibir a mensagem "Selecione um modal de transporte", não exibir nem atualizar a Secao_Resultado, a Secao_Comparacao e a Secao_Creditos, e preservar os valores já informados nos campos de origem, destino e Distancia_Manual.
4. IF origem ou destino estão vazios e a Distancia_Manual não foi informada quando o usuário aciona o botão de cálculo, THEN THE Interface SHALL exibir a mensagem "Informe origem e destino ou a distância manual", não exibir nem atualizar a Secao_Resultado, a Secao_Comparacao e a Secao_Creditos, e preservar o Modal selecionado e os valores já informados nos campos.
5. WHEN o usuário aciona o botão de cálculo com cidades da Base_de_Rotas e uma Distancia_Manual válida informadas simultaneamente, THE Aplicacao SHALL usar a Distancia_Manual como distância do cálculo e ignorar a distância da Base_de_Rotas.
6. IF o usuário aciona o botão de cálculo sem Modal selecionado e sem distância disponível (origem ou destino vazios e Distancia_Manual não informada), THEN THE Interface SHALL exibir ambas as mensagens, "Selecione um modal de transporte" e "Informe origem e destino ou a distância manual", simultaneamente.

### Requirement 6: Resultado da viagem

**User Story:** Como usuário, quero ver a distância e a emissão da viagem, para que eu saiba quanto CO2 ela gera.

#### Acceptance Criteria

1. WHEN o cálculo é concluído com sucesso, THE Secao_Resultado SHALL exibir, em até 1 segundo, a distância em km, o Modal escolhido e a Emissao em kg de CO2, cada um com seu rótulo e unidade.
2. WHEN o cálculo é solicitado com distância maior que 0 km e menor ou igual a 20.000 km, THE Calculadora SHALL calcular a Emissao como distância (km) multiplicada pelo Fator_de_Emissao (g/km) do Modal, dividida por 1000.
3. WHEN o Modal é bicicleta, THE Calculadora SHALL retornar Emissao igual a 0 kg.
4. THE Interface SHALL exibir a Emissao com exatamente 2 casas decimais (arredondamento half-up) e separador decimal em vírgula, e a distância com separador de milhar em ponto e separador decimal em vírgula (exemplo: 1.234,5 km).
5. FOR ALL distâncias válidas (maiores que 0 km e menores ou iguais a 20.000 km), THE Calculadora SHALL produzir Emissao proporcional à distância, de modo que dobrar a distância dobre a Emissao do mesmo Modal, antes do arredondamento de exibição.
6. IF a distância não está disponível, é menor ou igual a 0 km, ou excede 20.000 km, ou se o Fator_de_Emissao do Modal está ausente (indefinido), não é numérico ou é negativo, THEN THE Secao_Resultado SHALL exibir uma mensagem de erro indicando que o cálculo não pôde ser concluído, SHALL NOT exibir valor de Emissao e SHALL manter os dados de entrada informados pelo usuário.
7. WHEN o Fator_de_Emissao de qualquer Modal é igual a 0 g/km, THE Calculadora SHALL tratar esse valor como válido e definido, concluir o cálculo com sucesso e retornar Emissao igual a 0 kg, e THE Secao_Resultado SHALL exibir Emissao igual a 0,00 kg sem exibir mensagem de erro.

### Requirement 7: Comparação entre modais

**User Story:** Como usuário, quero comparar a emissão dos quatro modais para a mesma viagem, para que eu escolha a opção mais sustentável.

#### Acceptance Criteria

1. WHEN o cálculo é concluído com sucesso, THE Secao_Comparacao SHALL exibir, em até 1 segundo, a Emissao em kg de CO₂ dos quatro Modais, todas calculadas para a mesma distância informada, com 2 casas decimais.
2. WHEN a Secao_Comparacao é exibida, THE Secao_Comparacao SHALL ordenar os Modais da menor para a maior Emissao, e, IF dois Modais tiverem Emissao igual, THEN THE Secao_Comparacao SHALL manter entre eles a ordem em que os Modais foram originalmente definidos.
3. WHEN a Secao_Comparacao é exibida, THE Secao_Comparacao SHALL exibir, para cada Modal, uma barra cuja largura seja igual a (Emissao do Modal ÷ maior Emissao entre os Modais) × 100% da largura máxima da barra, arredondada para o inteiro mais próximo, de modo que o Modal de maior Emissao tenha largura de 100%.
4. IF a maior Emissao entre os Modais é 0 kg, THEN THE Secao_Comparacao SHALL exibir todas as barras com largura 0% e SHALL NOT realizar divisão por zero.
5. WHEN a Secao_Comparacao é exibida, THE Secao_Comparacao SHALL exibir, para cada Modal com Emissao maior que 0 kg, a diferença percentual em relação ao Modal de menor Emissao diferente de zero, calculada como ((Emissao do Modal − menor Emissao diferente de zero) ÷ menor Emissao diferente de zero) × 100, com 1 casa decimal e sinal "+" quando maior que 0.
6. IF um Modal tem Emissao igual a 0 kg, THEN THE Secao_Comparacao SHALL exibir para esse Modal o valor 0,00 kg, barra com largura 0% e indicação de que não há diferença percentual aplicável.
7. IF todos os Modais têm Emissao igual a 0 kg, THEN THE Secao_Comparacao SHALL omitir a diferença percentual de todos os Modais e exibir uma mensagem indicando que não há emissão a comparar.
8. IF o cálculo falha ou a distância informada é inválida, THEN THE Secao_Comparacao SHALL NOT exibir valores de Emissao, barras ou diferenças percentuais e SHALL manter o último resultado exibido oculto até um novo cálculo bem-sucedido.

### Requirement 8: Créditos de carbono e custo de compensação

**User Story:** Como usuário, quero saber quantos créditos de carbono compensam minha viagem e quanto custam, para que eu avalie compensar a emissão.

#### Acceptance Criteria

1. WHEN a Emissao (kg de CO2) é calculada, THE Calculadora SHALL calcular os créditos necessários como Emissao (kg) dividida por 1000, sem arredondamento no cálculo interno (1 crédito = 1 tonelada de CO2).
2. WHEN os créditos necessários são calculados, THE Calculadora SHALL calcular o Custo_de_Compensacao como créditos necessários multiplicados pelo Preco_do_Credito (em BRL por crédito) da Configuracao, sem arredondamento no cálculo interno.
3. WHEN o cálculo é concluído, THE Secao_Creditos SHALL exibir a quantidade de créditos arredondada para 4 casas decimais e o Custo_de_Compensacao em reais (BRL) arredondado para 2 casas decimais, usando arredondamento meio para cima (ex.: Emissao de 123,45 kg exibe 0,1235 créditos).
4. WHEN a Emissao é 0 kg, THE Secao_Creditos SHALL exibir 0,0000 créditos, custo R$ 0,00 e uma mensagem informando que não há emissão a compensar.
5. WHEN a Secao_Creditos exibe créditos e custo, THE Secao_Creditos SHALL exibir junto aos valores um aviso de que o custo é uma estimativa baseada no Preco_do_Credito da Configuracao, informando o valor do Preco_do_Credito utilizado em BRL com 2 casas decimais.
6. FOR ALL Emissoes maiores ou iguais a 0 kg, o Custo_de_Compensacao SHALL ser proporcional à Emissao, com razão igual a Preco_do_Credito dividido por 1000 por kg de CO2, com tolerância máxima de R$ 0,01 devido ao arredondamento de exibição.
7. IF o Preco_do_Credito da Configuracao estiver ausente, não for numérico ou for menor que 0, THEN THE Calculadora SHALL não calcular o Custo_de_Compensacao, e THE Secao_Creditos SHALL exibir uma mensagem de erro indicando que o Preco_do_Credito é inválido, mantendo exibida a quantidade de créditos necessários.
8. IF a Emissao for negativa ou não numérica, THEN THE Calculadora SHALL não calcular créditos nem custo, e THE Secao_Creditos SHALL exibir uma mensagem de erro indicando que a Emissao é inválida, sem exibir valores de créditos ou custo.

### Requirement 9: Configuração de fatores e preço

**User Story:** Como desenvolvedor, quero os fatores de emissão e o preço do crédito centralizados, para que eu os ajuste sem alterar a lógica.

#### Acceptance Criteria

1. THE Configuracao SHALL definir exatamente um Fator_de_Emissao em g/km, com valor numérico maior ou igual a 0, para cada um dos quatro modais: bicicleta, carro, ônibus e caminhão.
2. THE Configuracao SHALL definir exatamente um Preco_do_Credito em reais por tonelada de CO2, com valor numérico maior que 0 e menor ou igual a 999.999,99, expresso com no máximo 2 casas decimais.
3. THE Calculadora SHALL ler todos os Fatores_de_Emissao e o Preco_do_Credito exclusivamente da Configuracao, sem usar valores numéricos de fator ou preço definidos fora dela.
4. THE Configuracao SHALL documentar, em comentário adjacente a cada valor, a unidade do valor e a fonte de referência adotada (nome da fonte e ano de publicação).
5. IF a Configuracao não definir algum Fator_de_Emissao ou o Preco_do_Credito, ou definir um valor não numérico, negativo ou fora das faixas dos critérios 1 e 2, THEN THE Calculadora SHALL rejeitar o carregamento da Configuracao, sinalizar um erro que identifique o item inválido e não realizar nenhum cálculo.
6. WHEN um valor da Configuracao é alterado e a Calculadora é executada novamente, THE Calculadora SHALL produzir resultados baseados no valor alterado, sem que seja necessário modificar o código da lógica de cálculo.

### Requirement 10: Organização do código e testabilidade

**User Story:** Como desenvolvedor, quero módulos separados e testáveis no console, para que eu valide cada parte isoladamente.

#### Acceptance Criteria

1. THE EcoTrip SHALL organizar o código em exatamente 7 arquivos: index.html, style.css, o arquivo da Base_de_Rotas, config.js, calculator.js, ui.js e app.js, sem outros arquivos de script ou de estilo próprios.
2. THE EcoTrip SHALL expor, após o carregamento completo da página, cinco objetos globais acessíveis em `window` no console do navegador: Calculadora, Interface, Aplicacao, Configuracao e Base_de_Rotas, cada um com `typeof` igual a "object".
3. THE Calculadora SHALL implementar suas funções de cálculo sem ler nem escrever no DOM, ou seja, sem referenciar `document` nem `window.document`.
4. WHEN o desenvolvedor chama uma função da Calculadora no console com valores numéricos de teste, THE Calculadora SHALL retornar o resultado em até 100 ms, sem que a Interface tenha sido inicializada.
5. THE index.html SHALL carregar os scripts em exatamente esta ordem: Base_de_Rotas, config.js, calculator.js, ui.js, app.js.
6. IF o desenvolvedor chama uma função da Calculadora no console com um valor inválido (não numérico, negativo, `null` ou `undefined`), THEN THE Calculadora SHALL retornar um indicador de erro ou lançar uma exceção identificando o parâmetro inválido, sem alterar o DOM e sem alterar o estado da Configuracao, de modo que a exibição de qualquer mensagem de erro ao usuário seja responsabilidade exclusiva da Interface e não da Calculadora.

### Requirement 11: Tratamento de erros e acessibilidade

**User Story:** Como usuário, quero mensagens claras e uma interface acessível, para que eu use a aplicação sem dificuldade.

#### Acceptance Criteria

1. IF ocorre um erro de validação em um campo, THEN THE Interface SHALL exibir, em até 100 ms após a tentativa de cálculo, uma mensagem de no máximo 120 caracteres que indique o motivo da rejeição, posicionada imediatamente adjacente ao campo afetado, em uma região com role="alert", e SHALL preservar os valores já digitados em todos os campos.
2. WHEN o usuário corrige o campo com erro e aciona o cálculo, THE Interface SHALL remover a mensagem de erro anterior desse campo em até 100 ms, caso o novo valor seja válido.
3. IF o usuário aciona o cálculo e o novo valor do campo continua inválido, THEN THE Interface SHALL substituir a mensagem anterior por uma única mensagem atual, sem exibir mensagens duplicadas para o mesmo campo.
4. THE Interface SHALL permitir que todos os controles interativos (campos, botões, seletores e links) sejam focados, acionados e operados apenas com o teclado (Tab, Shift+Tab, Enter, Espaço e setas), em ordem de foco que siga a ordem visual de leitura, com indicador de foco visível em cada controle focado.
5. THE EcoTrip SHALL manter razão de contraste mínima de 4.5:1 entre texto de tamanho normal (menor que 18 pt, ou menor que 14 pt em negrito) e seu fundo, e de 3:1 para texto grande, nos estados normal, foco e desabilitado, incluindo mensagens de erro.
6. THE EcoTrip SHALL apresentar o layout sem rolagem horizontal, sem sobreposição de elementos e sem truncamento de texto ou controles em larguras de tela de 320 px a 1920 px inclusive.

### Requirement 12: Publicação e deploy

**User Story:** Como autor do projeto, quero publicar a aplicação no GitHub Pages, para que qualquer pessoa a acesse por uma URL.

#### Acceptance Criteria

1. THE Repositorio SHALL ter visibilidade pública, e seu nome SHALL conter de 1 a 100 caracteres, somente letras minúsculas de a a z, dígitos de 0 a 9 e hífens, sem acentos, espaços ou letras maiúsculas.
2. THE Repositorio SHALL conter ao menos um arquivo de workflow no diretório .github/workflows que publica o EcoTrip no GitHub Pages por meio do GitHub Actions.
3. WHEN um commit é enviado à branch de publicação, THE Pipeline_de_Deploy SHALL concluir a publicação da versão correspondente a esse commit em até 10 minutos, e a URL do GitHub Pages SHALL servir essa versão com resposta bem-sucedida.
4. IF a execução do Pipeline_de_Deploy falha em qualquer etapa, THEN THE Pipeline_de_Deploy SHALL marcar a execução como falha no GitHub Actions e SHALL manter publicada a última versão que foi publicada com sucesso.
5. IF o Repositorio pertence a github.com/Gtvnv e é um projeto pessoal novo, THEN THE autor MAY commitar e fazer push diretamente na main, sem usar push --force nem reescrever o histórico da main.
6. IF o Repositorio não pertence a github.com/Gtvnv ou não é um projeto pessoal novo, THEN THE autor SHALL alterar a main somente por meio de Pull Request, a partir de uma branch de trabalho, com aprovação de um revisor humano antes do merge.
7. THE Repositorio SHALL excluir do versionamento, por meio de regras no arquivo .gitignore, arquivos de variáveis de ambiente (.env), arquivos de credenciais e chaves de API, de modo que nenhum desses arquivos apareça como não rastreado ou seja incluído em commits.
8. WHEN o Repositorio deixa de ser classificado como projeto pessoal novo, THE permissão de push direto na main do critério 5 SHALL permanecer válida até o próximo ciclo de release ou até uma decisão explícita do autor, o que ocorrer primeiro, e, a partir de então, THE autor SHALL alterar a main somente por meio de Pull Request, conforme o critério 6.

### Requirement 13: Documentação (README)

**User Story:** Como visitante do repositório, quero um README completo, para que eu entenda e use a calculadora.

#### Acceptance Criteria

1. THE README.md SHALL conter uma seção de visão geral com no máximo 150 palavras que descreva o propósito da calculadora e uma lista numerada de passos de uso, cobrindo a escolha da origem, do destino e do modal e a leitura do resultado.
2. THE README.md SHALL conter uma seção de explicação do cálculo que apresente, em ordem, a obtenção da distância, a aplicação do Fator_de_Emissao, o cálculo do Credito_de_Carbono e o cálculo do Custo_de_Compensacao, com a fórmula de cada etapa.
3. THE README.md SHALL incluir na seção de explicação do cálculo um exemplo numérico com uma rota, um modal e valores de entrada declarados, que mostre o resultado de cada etapa até o Custo_de_Compensacao, com resultados coerentes com a lógica de calculator.js.
4. THE README.md SHALL listar a ordem de construção em uma lista numerada com exatamente seis itens, nesta sequência: index.html, style.css, Base_de_Rotas e config.js, calculator.js, ui.js, app.js.
5. THE README.md SHALL incluir ao menos um prompt, em bloco de citação ou de código, que tenha funcionado bem durante a construção, acompanhado de uma frase que informe a qual etapa da construção ele se refere.
6. THE README.md SHALL conter a URL publicada do EcoTrip, em formato de link que comece com "https://".
7. WHERE existir um arquivo de captura de tela de uma viagem calculada no repositório, THE README.md SHALL exibir a imagem com texto alternativo não vazio que descreva a viagem exibida.
8. THE README.md SHALL listar como ideias futuras exatamente cinco itens: mais cidades, destaque do modal selecionado, soma de várias viagens, API de mapas e back-end em Python.
