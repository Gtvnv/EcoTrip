// Configuracao da EcoTrip: fatores de emissao por modal e preco do credito de carbono.
// Somente dados. A validacao fica em Calculadora.validarConfiguracao.
const Configuracao = {
  fatoresEmissao: {
    bicicleta: 0, // g CO2/km. Fonte: GHG Conversion Factors (DEFRA/DESNZ, Reino Unido), 2023 (pedalar nao tem emissao direta)
    carro: 170, // g CO2/km. Fonte: GHG Conversion Factors (DEFRA/DESNZ, Reino Unido), 2023 (carro medio)
    onibus: 100, // g CO2/km por passageiro. Fonte: GHG Conversion Factors (DEFRA/DESNZ, Reino Unido), 2023 (onibus medio)
    caminhao: 900, // g CO2/km do veiculo. Fonte: GHG Conversion Factors (DEFRA/DESNZ, Reino Unido), 2023 (caminhao rigido/articulado, media)
  },
  precoCredito: 50.0, // R$ por tonelada de CO2 (1 credito). Fonte: valor de referencia adotado pelo projeto (mercado voluntario de carbono), 2024
};

if (typeof window !== "undefined") {
  window.Configuracao = Configuracao;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = Configuracao;
}
