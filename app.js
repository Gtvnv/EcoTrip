// Aplicacao: único ponto que conhece Calculadora e Interface.
// Lê as entradas, valida, calcula e entrega resultados ou erros à Interface.
(function () {
  "use strict";

  var global = typeof window !== "undefined" ? window : globalThis;

  var MSG_SEM_MODAL = "Selecione um modal de transporte";
  var MSG_SEM_ENTRADA = "Informe origem e destino ou a distância manual";
  var MSG_MESMA_CIDADE = "Origem e destino devem ser diferentes";
  var MSG_DISTANCIA_INVALIDA = "Informe uma distância válida em km";
  var MSG_DISTANCIA_MAXIMA = "A distância máxima é 20000 km";
  var MSG_ROTA_INEXISTENTE = "Rota não encontrada. Informe a distância manual em km";
  var MSG_FALHA_INESPERADA = "Não foi possível concluir o cálculo. Tente novamente";

  var CAMPOS_ERRO = ["origem", "destino", "distancia-manual", "modal", "geral"];

  // Dependências resolvidas na hora do uso (globais no navegador, módulos em Node).
  function calculadora() {
    if (typeof Calculadora !== "undefined") return Calculadora;
    if (typeof require === "function") return require("./calculator.js");
    return global.Calculadora;
  }

  function interfaceUsuario() {
    if (typeof Interface !== "undefined") return Interface;
    if (typeof require === "function") return require("./ui.js");
    return global.Interface;
  }

  function configuracao() {
    if (typeof Configuracao !== "undefined") return Configuracao;
    if (typeof require === "function") return require("./config.js");
    return global.Configuracao;
  }

  function textoVazio(valor) {
    return valor === undefined || valor === null || String(valor).trim() === "";
  }

  function limparTodosErros() {
    var ui = interfaceUsuario();
    CAMPOS_ERRO.forEach(function (campo) {
      ui.limparErro(campo);
    });
  }

  // Avalia o formulário aplicando as regras na ordem do design.
  // Devolve { erros: [{campo, mensagem}], distanciaKm } (distanciaKm só quando não há erros).
  function avaliar(dados) {
    var calc = calculadora();
    var erros = [];
    var distanciaKm = null;
    var manualInformada = !textoVazio(dados.distanciaManual);

    if (!dados.modal) {
      erros.push({ campo: "modal", mensagem: MSG_SEM_MODAL });
    }

    if (manualInformada) {
      try {
        distanciaKm = calc.validarDistanciaManual(dados.distanciaManual);
      } catch (erro) {
        if (erro instanceof calc.ErroCalculadora && erro.codigo === "DISTANCIA_MAXIMA") {
          erros.push({ campo: "distancia-manual", mensagem: MSG_DISTANCIA_MAXIMA });
        } else if (erro instanceof calc.ErroCalculadora) {
          erros.push({ campo: "distancia-manual", mensagem: MSG_DISTANCIA_INVALIDA });
        } else {
          throw erro;
        }
      }
    } else {
      var origem = textoVazio(dados.origem) ? "" : String(dados.origem).trim();
      var destino = textoVazio(dados.destino) ? "" : String(dados.destino).trim();

      if (origem === "" || destino === "") {
        if (origem === "") erros.push({ campo: "origem", mensagem: MSG_SEM_ENTRADA });
        if (destino === "") erros.push({ campo: "destino", mensagem: MSG_SEM_ENTRADA });
      } else if (calc.normalizarTexto(origem) === calc.normalizarTexto(destino)) {
        erros.push({ campo: "destino", mensagem: MSG_MESMA_CIDADE });
      } else {
        try {
          distanciaKm = calc.obterDistancia(origem, destino);
        } catch (erro) {
          if (erro instanceof calc.ErroCalculadora && erro.codigo === "ROTA_NAO_ENCONTRADA") {
            erros.push({ campo: "destino", mensagem: MSG_ROTA_INEXISTENTE });
          } else {
            throw erro;
          }
        }
      }
    }

    if (erros.length > 0) distanciaKm = null;
    return { erros: erros, distanciaKm: distanciaKm };
  }

  function validarFormulario(dados) {
    return avaliar(dados).erros;
  }

  function exibirErros(erros) {
    var ui = interfaceUsuario();
    var exibidos = {};
    erros.forEach(function (erro) {
      if (exibidos[erro.campo]) return; // uma mensagem por campo
      exibidos[erro.campo] = true;
      ui.exibirErro(erro.campo, erro.mensagem);
    });
  }

  // Calcula e exibe as três seções. Lança apenas erros inesperados.
  function calcularEExibir(dados, distanciaKm) {
    var calc = calculadora();
    var ui = interfaceUsuario();
    var config = configuracao();

    calc.validarConfiguracao();

    var emissaoKg;
    try {
      emissaoKg = calc.calcularEmissao(distanciaKm, dados.modal);
    } catch (erro) {
      if (erro instanceof calc.ErroCalculadora) {
        ui.ocultarResultados();
        ui.exibirResultado({ erro: true });
        return;
      }
      throw erro;
    }

    var itens = calc.compararModais(distanciaKm);
    var compensacao;
    try {
      compensacao = calc.calcularCompensacao(emissaoKg);
    } catch (erro) {
      if (!(erro instanceof calc.ErroCalculadora)) throw erro;
      compensacao = null;
    }

    ui.exibirResultado({ distanciaKm: distanciaKm, modal: dados.modal, emissaoKg: emissaoKg });
    ui.exibirComparacao(itens);
    if (compensacao === null) {
      ui.exibirCreditos({ erroEmissao: true });
    } else {
      ui.exibirCreditos({
        creditos: compensacao.creditos,
        custo: compensacao.custo,
        erroPreco: compensacao.erroPreco,
        emissaoZero: emissaoKg === 0,
        precoCredito: config ? config.precoCredito : undefined,
      });
    }
  }

  function mostrarErroInesperado(erro) {
    console.error(erro);
    var ui = interfaceUsuario();
    try {
      ui.ocultarResultados();
      ui.exibirErro("geral", MSG_FALHA_INESPERADA);
    } catch (e) {
      console.error(e);
    }
  }

  function aoCalcular(evento) {
    if (evento && typeof evento.preventDefault === "function") evento.preventDefault();
    var ui = interfaceUsuario();
    try {
      limparTodosErros();
      var dados = ui.lerFormulario();
      var avaliacao = avaliar(dados);
      if (avaliacao.erros.length > 0) {
        ui.ocultarResultados();
        exibirErros(avaliacao.erros);
        return;
      }
      calcularEExibir(dados, avaliacao.distanciaKm);
    } catch (erro) {
      var calc = calculadora();
      if (erro instanceof calc.ErroCalculadora && erro.codigo === "CONFIGURACAO_INVALIDA") {
        console.error(erro);
        ui.ocultarResultados();
        ui.exibirErro("geral", "Configuração inválida: " + erro.parametro);
        return;
      }
      mostrarErroInesperado(erro);
    }
  }

  // Reavalia ao mudar a distância manual, sem recarregar a página.
  function aoAlterarDistanciaManual() {
    var ui = interfaceUsuario();
    var calc = calculadora();
    try {
      var secao = typeof document !== "undefined" ? document.getElementById("secao-resultado") : null;
      var resultadoVisivel = !!secao && !secao.hidden;
      var dados = ui.lerFormulario();
      var manualValida = false;
      if (!textoVazio(dados.distanciaManual)) {
        try {
          calc.validarDistanciaManual(dados.distanciaManual);
          manualValida = true;
        } catch (erro) {
          if (!(erro instanceof calc.ErroCalculadora)) throw erro;
        }
      }
      if (!resultadoVisivel && !manualValida) return;

      var avaliacao = avaliar(dados);
      if (avaliacao.erros.length > 0) {
        ui.ocultarResultados();
        return;
      }
      ui.limparErro("distancia-manual");
      calcularEExibir(dados, avaliacao.distanciaKm);
    } catch (erro) {
      mostrarErroInesperado(erro);
    }
  }

  function iniciar() {
    var calc = calculadora();
    var ui = interfaceUsuario();
    var botao = document.getElementById("botao-calcular");

    try {
      calc.validarConfiguracao();
    } catch (erro) {
      console.error(erro);
      var item = erro && erro.parametro ? erro.parametro : "desconhecido";
      ui.exibirErro("geral", "Configuração inválida: " + item);
      if (botao) botao.disabled = true;
      return;
    }

    ui.inicializar();

    var formulario = document.getElementById("formulario-viagem");
    if (formulario) formulario.addEventListener("submit", aoCalcular);

    var manual = document.getElementById("campo-distancia-manual");
    if (manual) {
      manual.addEventListener("input", aoAlterarDistanciaManual);
      manual.addEventListener("change", aoAlterarDistanciaManual);
    }
  }

  var Aplicacao = {
    iniciar: iniciar,
    aoCalcular: aoCalcular,
    aoAlterarDistanciaManual: aoAlterarDistanciaManual,
    validarFormulario: validarFormulario,
  };

  if (typeof window !== "undefined") {
    window.Aplicacao = Aplicacao;
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
      } else {
        iniciar();
      }
    }
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Aplicacao;
  }
})();
