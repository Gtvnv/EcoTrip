// Base_de_Rotas: simula o back-end de distâncias rodoviárias entre cidades brasileiras.
// Distâncias aproximadas em km (0 < km <= 10000, no máximo 1 casa decimal).
// Cada par aparece uma só vez; a busca em Calculadora.obterDistancia é simétrica.
// Não há chave de API neste arquivo.
const Base_de_Rotas = {
  cidades: [
    "Belo Horizonte",
    "Brasília",
    "Curitiba",
    "Florianópolis",
    "Fortaleza",
    "Goiânia",
    "Porto Alegre",
    "Recife",
    "Rio de Janeiro",
    "Salvador",
    "São Paulo",
    "Vitória",
  ],
  distancias: [
    // São Paulo
    { origem: "São Paulo", destino: "Rio de Janeiro", km: 430.0 },
    { origem: "São Paulo", destino: "Belo Horizonte", km: 586.0 },
    { origem: "São Paulo", destino: "Brasília", km: 1015.0 },
    { origem: "São Paulo", destino: "Curitiba", km: 408.0 },
    { origem: "São Paulo", destino: "Porto Alegre", km: 1115.0 },
    { origem: "São Paulo", destino: "Salvador", km: 1962.0 },
    { origem: "São Paulo", destino: "Recife", km: 2660.0 },
    { origem: "São Paulo", destino: "Fortaleza", km: 3120.0 },
    { origem: "São Paulo", destino: "Goiânia", km: 926.0 },
    { origem: "São Paulo", destino: "Florianópolis", km: 705.0 },
    { origem: "São Paulo", destino: "Vitória", km: 882.0 },
    // Rio de Janeiro
    { origem: "Rio de Janeiro", destino: "Belo Horizonte", km: 440.0 },
    { origem: "Rio de Janeiro", destino: "Brasília", km: 1148.0 },
    { origem: "Rio de Janeiro", destino: "Curitiba", km: 852.0 },
    { origem: "Rio de Janeiro", destino: "Porto Alegre", km: 1553.0 },
    { origem: "Rio de Janeiro", destino: "Salvador", km: 1649.0 },
    { origem: "Rio de Janeiro", destino: "Recife", km: 2335.0 },
    { origem: "Rio de Janeiro", destino: "Fortaleza", km: 2805.0 },
    { origem: "Rio de Janeiro", destino: "Goiânia", km: 1325.0 },
    { origem: "Rio de Janeiro", destino: "Florianópolis", km: 1142.0 },
    { origem: "Rio de Janeiro", destino: "Vitória", km: 520.0 },
    // Belo Horizonte
    { origem: "Belo Horizonte", destino: "Brasília", km: 740.0 },
    { origem: "Belo Horizonte", destino: "Curitiba", km: 1002.0 },
    { origem: "Belo Horizonte", destino: "Porto Alegre", km: 1712.0 },
    { origem: "Belo Horizonte", destino: "Salvador", km: 1372.0 },
    { origem: "Belo Horizonte", destino: "Recife", km: 2070.0 },
    { origem: "Belo Horizonte", destino: "Fortaleza", km: 2528.0 },
    { origem: "Belo Horizonte", destino: "Goiânia", km: 906.0 },
    { origem: "Belo Horizonte", destino: "Florianópolis", km: 1344.0 },
    { origem: "Belo Horizonte", destino: "Vitória", km: 524.0 },
    // Brasília
    { origem: "Brasília", destino: "Curitiba", km: 1366.0 },
    { origem: "Brasília", destino: "Porto Alegre", km: 2027.0 },
    { origem: "Brasília", destino: "Salvador", km: 1446.0 },
    { origem: "Brasília", destino: "Recife", km: 2130.0 },
    { origem: "Brasília", destino: "Fortaleza", km: 2200.0 },
    { origem: "Brasília", destino: "Goiânia", km: 209.0 },
    { origem: "Brasília", destino: "Florianópolis", km: 1673.0 },
    { origem: "Brasília", destino: "Vitória", km: 1230.0 },
    // Curitiba
    { origem: "Curitiba", destino: "Porto Alegre", km: 711.0 },
    { origem: "Curitiba", destino: "Salvador", km: 2370.0 },
    { origem: "Curitiba", destino: "Recife", km: 3070.0 },
    { origem: "Curitiba", destino: "Fortaleza", km: 3520.0 },
    { origem: "Curitiba", destino: "Goiânia", km: 1354.0 },
    { origem: "Curitiba", destino: "Florianópolis", km: 300.0 },
    { origem: "Curitiba", destino: "Vitória", km: 1290.0 },
    // Porto Alegre
    { origem: "Porto Alegre", destino: "Salvador", km: 3100.0 },
    { origem: "Porto Alegre", destino: "Recife", km: 3770.0 },
    { origem: "Porto Alegre", destino: "Fortaleza", km: 4220.0 },
    { origem: "Porto Alegre", destino: "Goiânia", km: 1830.0 },
    { origem: "Porto Alegre", destino: "Florianópolis", km: 476.0 },
    { origem: "Porto Alegre", destino: "Vitória", km: 1990.0 },
    // Salvador
    { origem: "Salvador", destino: "Recife", km: 800.0 },
    { origem: "Salvador", destino: "Fortaleza", km: 1389.0 },
    { origem: "Salvador", destino: "Goiânia", km: 1630.0 },
    { origem: "Salvador", destino: "Florianópolis", km: 2650.0 },
    { origem: "Salvador", destino: "Vitória", km: 1200.0 },
    // Recife
    { origem: "Recife", destino: "Fortaleza", km: 800.0 },
    { origem: "Recife", destino: "Goiânia", km: 2240.0 },
    { origem: "Recife", destino: "Florianópolis", km: 3350.0 },
    { origem: "Recife", destino: "Vitória", km: 1980.0 },
    // Fortaleza
    { origem: "Fortaleza", destino: "Goiânia", km: 2500.0 },
    { origem: "Fortaleza", destino: "Florianópolis", km: 3800.0 },
    { origem: "Fortaleza", destino: "Vitória", km: 2700.0 },
    // Goiânia
    { origem: "Goiânia", destino: "Florianópolis", km: 1650.0 },
    { origem: "Goiânia", destino: "Vitória", km: 1450.0 },
    // Florianópolis
    { origem: "Florianópolis", destino: "Vitória", km: 1650.0 },
  ],
};

if (typeof window !== "undefined") {
  window.Base_de_Rotas = Base_de_Rotas;
}

if (typeof module !== "undefined") module.exports = Base_de_Rotas;
