// Calculadora da EcoTrip: funcoes puras, sem acesso ao DOM.
// Erros sao sinalizados com ErroCalculadora (parametro, codigo); a Interface traduz em mensagens.
// Configuracao e Base_de_Rotas vem por parametro opcional; o padrao sao os globais
// (no navegador) ou os modulos ./config.js e ./rotas.js (em Node).
(function () {
  "use strict";

  class ErroCalculadora extends Error {
    constructor(mensagem, parametro, codigo) {
      super(mensagem);
      this.name = "ErroCalculadora";
      this.parametro = parametro;
      this.codigo = codigo;
    }
  }

  const MODAIS = Object.freeze(["bicicleta", "carro", "onibus", "caminhao"]);
  const DISTANCIA_MAXIMA_KM = 20000;
  const MIN_CARACTERES_BUSCA = 2;
  const MAX_SUGESTOES = 10;
  const PRECO_MAXIMO = 999999.99;

  // ---------- Acesso aos padroes (globais ou modulos Node) ----------

  function obterConfiguracaoPadrao() {
    if (typeof Configuracao !== "undefined") return Configuracao;
    if (typeof require === "function") return require("./config.js");
    return undefined;
  }

  function obterBasePadrao() {
    if (typeof Base_de_Rotas !== "undefined") return Base_de_Rotas;
    if (typeof require === "function") return require("./rotas.js");
    return undefined;
  }

  function ehNumeroFinito(valor) {
    return typeof valor === "number" && Number.isFinite(valor);
  }

  // ---------- Configuracao ----------

  function validarConfiguracao(config) {
    if (config === undefined) config = obterConfiguracaoPadrao();
    if (config === null || typeof config !== "object") {
      throw new ErroCalculadora("Configuracao ausente ou invalida", "configuracao", "CONFIGURACAO_INVALIDA");
    }
    const fatores = config.fatoresEmissao;
    if (fatores === null || typeof fatores !== "object") {
      throw new ErroCalculadora("fatoresEmissao ausente ou invalido", "fatoresEmissao", "CONFIGURACAO_INVALIDA");
    }
    for (const modal of MODAIS) {
      const fator = fatores[modal];
      if (!ehNumeroFinito(fator) || fator < 0) {
        throw new ErroCalculadora(
          "Fator de emissao invalido: " + modal,
          "fatoresEmissao." + modal,
          "CONFIGURACAO_INVALIDA"
        );
      }
    }
    const preco = config.precoCredito;
    const centavos = ehNumeroFinito(preco) ? Number((preco * 100).toPrecision(12)) : NaN;
    if (!ehNumeroFinito(preco) || preco <= 0 || preco > PRECO_MAXIMO || !Number.isInteger(centavos)) {
      throw new ErroCalculadora("Preco do credito invalido", "precoCredito", "CONFIGURACAO_INVALIDA");
    }
  }

  // ---------- Distancia ----------

  // Funcao_de_Distancia: unico ponto de obtencao da distancia entre cidades.
  function obterDistancia(origem, destino, base) {
    if (base === undefined) base = obterBasePadrao();
    if (typeof origem !== "string") {
      throw new ErroCalculadora("Origem invalida", "origem", "PARAMETRO_INVALIDO");
    }
    if (typeof destino !== "string") {
      throw new ErroCalculadora("Destino invalido", "destino", "PARAMETRO_INVALIDO");
    }
    const registros = base && Array.isArray(base.distancias) ? base.distancias : [];
    for (const r of registros) {
      if (
        (r.origem === origem && r.destino === destino) ||
        (r.origem === destino && r.destino === origem)
      ) {
        return r.km;
      }
    }
    throw new ErroCalculadora("Rota nao encontrada", "origem,destino", "ROTA_NAO_ENCONTRADA");
  }

  function validarDistanciaManual(valor) {
    let numero = NaN;
    if (typeof valor === "number") {
      numero = valor;
    } else if (typeof valor === "string" && valor.trim() !== "") {
      numero = Number(valor.trim());
    }
    if (!Number.isFinite(numero) || numero <= 0) {
      throw new ErroCalculadora("Distancia manual invalida", "distanciaManual", "DISTANCIA_INVALIDA");
    }
    if (numero > DISTANCIA_MAXIMA_KM) {
      throw new ErroCalculadora("Distancia manual acima do maximo", "distanciaManual", "DISTANCIA_MAXIMA");
    }
    return numero;
  }

  function resolverDistancia(origem, destino, manual, base) {
    const informada =
      manual !== undefined && manual !== null && !(typeof manual === "string" && manual.trim() === "");
    if (informada) return validarDistanciaManual(manual);
    return obterDistancia(origem, destino, base);
  }

  // ---------- Arredondamento e formatacao (pt-BR, sem Intl) ----------

  function arredondarMeioParaCima(valor, casas) {
    if (!ehNumeroFinito(valor)) {
      throw new ErroCalculadora("Valor invalido para arredondamento", "valor", "PARAMETRO_INVALIDO");
    }
    const fator = Math.pow(10, casas);
    return Math.round(Number((valor * fator).toPrecision(15))) / fator;
  }

  function formatarNumero(valor, casas, milhar) {
    const arredondado = arredondarMeioParaCima(valor, casas);
    const negativo = arredondado < 0;
    const partes = Math.abs(arredondado).toFixed(casas).split(".");
    let inteira = partes[0];
    if (milhar) inteira = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const texto = casas > 0 ? inteira + "," + partes[1] : inteira;
    return negativo ? "-" + texto : texto;
  }

  function formatarEmissao(kg) {
    return formatarNumero(kg, 2);
  }

  // Distancia: 1 casa decimal, ou 2 quando a segunda casa for diferente de zero (ex.: 1.234,5).
  function formatarDistancia(km) {
    const duasCasas = arredondarMeioParaCima(km, 2);
    const casas = Math.round(duasCasas * 100) % 10 === 0 ? 1 : 2;
    return formatarNumero(km, casas, true);
  }

  function formatarCreditos(valor) {
    return formatarNumero(valor, 4);
  }

  function formatarCusto(valor) {
    return formatarNumero(valor, 2);
  }

  // ---------- Autocomplete ----------

  function normalizarTexto(texto) {
    return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function filtrarCidades(texto, cidades) {
    if (cidades === undefined) {
      const base = obterBasePadrao();
      cidades = base ? base.cidades : [];
    }
    if (typeof texto !== "string" || !Array.isArray(cidades)) return [];
    const busca = normalizarTexto(texto);
    if (busca.length < MIN_CARACTERES_BUSCA) return [];
    const encontradas = [];
    for (const cidade of cidades) {
      if (normalizarTexto(cidade).includes(busca) && !encontradas.includes(cidade)) {
        encontradas.push(cidade);
      }
    }
    encontradas.sort(function (a, b) {
      const na = normalizarTexto(a);
      const nb = normalizarTexto(b);
      if (na < nb) return -1;
      if (na > nb) return 1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return encontradas.slice(0, MAX_SUGESTOES);
  }

  // ---------- Emissao, comparacao e compensacao ----------

  function resolverConfig(config) {
    return config === undefined ? obterConfiguracaoPadrao() : config;
  }

  // Emissao em kg de CO2: distancia (km) * fator (g/km) / 1000.
  function calcularEmissao(distanciaKm, modal, config) {
    if (!ehNumeroFinito(distanciaKm) || distanciaKm <= 0 || distanciaKm > DISTANCIA_MAXIMA_KM) {
      throw new ErroCalculadora("Distancia invalida", "distanciaKm", "DISTANCIA_INVALIDA");
    }
    config = resolverConfig(config);
    const fatores = config && config.fatoresEmissao;
    const fator = fatores !== null && typeof fatores === "object" ? fatores[modal] : undefined;
    if (!ehNumeroFinito(fator) || fator < 0) {
      throw new ErroCalculadora(
        "Fator de emissao invalido: " + String(modal),
        "fatoresEmissao." + String(modal),
        "FATOR_INVALIDO"
      );
    }
    return (distanciaKm * fator) / 1000;
  }

  function compararModais(distanciaKm, config) {
    config = resolverConfig(config);
    const itens = MODAIS.map(function (modal, indice) {
      return { modal: modal, emissaoKg: calcularEmissao(distanciaKm, modal, config), indice: indice };
    });
    let max = 0;
    let menorNaoZero = Infinity;
    for (const item of itens) {
      if (item.emissaoKg > max) max = item.emissaoKg;
      if (item.emissaoKg > 0 && item.emissaoKg < menorNaoZero) menorNaoZero = item.emissaoKg;
    }
    const semEmissao = max === 0;
    itens.sort(function (a, b) {
      return a.emissaoKg - b.emissaoKg || a.indice - b.indice;
    });
    const resultado = itens.map(function (item) {
      return {
        modal: item.modal,
        emissaoKg: item.emissaoKg,
        larguraPct: semEmissao ? 0 : Math.round((item.emissaoKg / max) * 100),
        diferencaPct:
          item.emissaoKg > 0 ? ((item.emissaoKg - menorNaoZero) / menorNaoZero) * 100 : null,
        semEmissao: semEmissao,
      };
    });
    resultado.semEmissao = semEmissao;
    return resultado;
  }

  function calcularCreditos(emissaoKg) {
    if (!ehNumeroFinito(emissaoKg) || emissaoKg < 0) {
      throw new ErroCalculadora("Emissao invalida", "emissaoKg", "EMISSAO_INVALIDA");
    }
    return emissaoKg / 1000;
  }

  function validarPreco(config) {
    const preco = config ? config.precoCredito : undefined;
    if (!ehNumeroFinito(preco) || preco <= 0) {
      throw new ErroCalculadora("Preco do credito invalido", "precoCredito", "PRECO_INVALIDO");
    }
    return preco;
  }

  function calcularCustoCompensacao(creditos, config) {
    if (!ehNumeroFinito(creditos) || creditos < 0) {
      throw new ErroCalculadora("Creditos invalidos", "creditos", "CREDITOS_INVALIDOS");
    }
    return creditos * validarPreco(resolverConfig(config));
  }

  // Preco invalido nao lanca: devolve os creditos e o erro, para a Interface manter os creditos.
  function calcularCompensacao(emissaoKg, config) {
    const creditos = calcularCreditos(emissaoKg);
    try {
      return { creditos: creditos, custo: calcularCustoCompensacao(creditos, config) };
    } catch (erro) {
      if (erro instanceof ErroCalculadora && erro.parametro === "precoCredito") {
        return { creditos: creditos, custo: null, erroPreco: erro };
      }
      throw erro;
    }
  }

  // ---------- Objeto Calculadora ----------

  const Calculadora = {
    ErroCalculadora: ErroCalculadora,
    MODAIS: MODAIS,
    DISTANCIA_MAXIMA_KM: DISTANCIA_MAXIMA_KM,
    MIN_CARACTERES_BUSCA: MIN_CARACTERES_BUSCA,
    MAX_SUGESTOES: MAX_SUGESTOES,
    validarConfiguracao: validarConfiguracao,
    obterDistancia: obterDistancia,
    validarDistanciaManual: validarDistanciaManual,
    resolverDistancia: resolverDistancia,
    arredondarMeioParaCima: arredondarMeioParaCima,
    formatarNumero: formatarNumero,
    formatarEmissao: formatarEmissao,
    formatarDistancia: formatarDistancia,
    formatarCreditos: formatarCreditos,
    formatarCusto: formatarCusto,
    normalizarTexto: normalizarTexto,
    filtrarCidades: filtrarCidades,
    calcularEmissao: calcularEmissao,
    compararModais: compararModais,
    calcularCreditos: calcularCreditos,
    calcularCustoCompensacao: calcularCustoCompensacao,
    calcularCompensacao: calcularCompensacao,
  };

  if (typeof window !== "undefined") {
    window.Calculadora = Calculadora;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Calculadora;
  }
})();
