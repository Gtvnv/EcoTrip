# EcoTrip

## Visão geral

A EcoTrip calcula a emissão de CO2 de uma viagem e o custo estimado para compensá-la com créditos de carbono. Ela compara quatro modais: bicicleta, carro, ônibus e caminhão. É feita só com HTML, CSS e JavaScript puros.

Como usar:

1. Digite a origem e escolha uma cidade na lista de sugestões.
2. Digite o destino e escolha uma cidade na lista.
3. Se a rota não existir na base, informe a distância manual em km.
4. Selecione o modal de transporte.
5. Clique em calcular e leia o resultado, a comparação entre modais e os créditos.

URL publicada (esperada após o deploy no GitHub Pages): [https://gtvnv.github.io/ecotrip/](https://gtvnv.github.io/ecotrip/)

## Como o cálculo funciona

Os valores abaixo vêm de `config.js` (fatores de emissão e preço do crédito) e de `rotas.js` (distâncias). As etapas são aplicadas nesta ordem:

1. **Distância (km):** obtida pela função `obterDistancia(origem, destino)` na base de rotas. A ordem das cidades não importa. Se houver distância manual válida (maior que 0 e até 20.000 km), ela é usada no lugar da base.
2. **Emissão (kg de CO2):** `emissão = distância (km) × fator de emissão (g/km) ÷ 1000`.
3. **Créditos de carbono:** `créditos = emissão (kg) ÷ 1000`. Cada crédito compensa 1 tonelada de CO2.
4. **Custo de compensação (R$):** `custo = créditos × preço do crédito (R$ por crédito)`.

Fatores atuais: bicicleta 0 g/km, carro 170 g/km, ônibus 100 g/km, caminhão 900 g/km. Preço do crédito: R$ 50,00.

### Exemplo numérico

Rota **São Paulo → Rio de Janeiro**, modal **carro**:

| Etapa | Conta | Resultado |
| --- | --- | --- |
| Distância | valor da base de rotas | 430 km |
| Emissão | 430 × 170 ÷ 1000 | 73,10 kg de CO2 |
| Créditos | 73,10 ÷ 1000 | 0,0731 crédito |
| Custo | 0,0731 × 50,00 | R$ 3,655, exibido como R$ 3,66 |

Esses valores foram conferidos executando `calculator.js` e `config.js` em Node. A tela exibe a emissão com 2 casas, os créditos com 4 casas e o custo com 2 casas, com arredondamento meio para cima.

## Ordem de construção

1. `index.html`
2. `style.css`
3. Base de rotas (`rotas.js`) e `config.js`
4. `calculator.js`
5. `ui.js`
6. `app.js`

## Prompt que funcionou bem

Este prompt foi usado na etapa 4 (`calculator.js`):

```text
Crie calculator.js com funções puras, sem acessar o DOM. A distância deve vir
de uma única função (obterDistancia), para eu poder trocá-la depois por uma API
de mapas. Fatores e preço devem vir só de config.js. Entradas inválidas devem
lançar um erro que identifique o parâmetro.
```

## Ideias futuras

1. Mais cidades na base de rotas.
2. Destaque do modal selecionado na comparação.
3. Soma de várias viagens.
4. API de mapas para obter a distância.
5. Back-end em Python.
