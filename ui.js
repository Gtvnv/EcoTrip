// Interface: manipula somente o DOM. Nenhuma regra de cálculo fica aqui.
(function () {
  "use strict";

  var CAMPOS_AUTOCOMPLETE = ["origem", "destino"];
  var IDS_SECOES_RESULTADO = ["secao-resultado", "secao-comparacao", "secao-creditos"];
  var MENSAGEM_SEM_CIDADE = "Nenhuma cidade encontrada";
  var CLASSE_ITEM = "sugestoes__item";
  var CLASSE_DESTACADO = "sugestoes__item--destacado";
  var CLASSE_VAZIO = "sugestoes__item--vazio";

  var MAX_CARACTERES_ERRO = 120;
  var MENSAGEM_CALCULO_FALHOU = "Não foi possível concluir o cálculo";
  var MENSAGEM_SEM_COMPARACAO = "Sem emissão a comparar: todos os modais têm emissão zero";
  var MENSAGEM_SEM_EMISSAO_COMPENSAR = "Não há emissão a compensar";
  var MENSAGEM_PRECO_INVALIDO = "Preço do crédito de carbono inválido";
  var MENSAGEM_EMISSAO_INVALIDA = "Emissão inválida; não foi possível calcular os créditos";
  var ROTULOS_MODAL = { bicicleta: "Bicicleta", carro: "Carro", onibus: "Ônibus", caminhao: "Caminhão" };

  // Aceita "distancia-manual" ou "distanciaManual".
  function obterRegiaoErro(campo) {
    var nome = String(campo).replace(/([A-Z])/g, "-$1").toLowerCase();
    return document.getElementById("erro-" + nome);
  }

  function adicionarItemDefinicao(dl, prefixo, rotulo, valor) {
    var item = document.createElement("div");
    item.className = prefixo + "__item";
    var dt = document.createElement("dt");
    dt.className = prefixo + "__rotulo";
    dt.textContent = rotulo;
    var dd = document.createElement("dd");
    dd.className = prefixo + "__valor";
    dd.textContent = valor;
    item.appendChild(dt);
    item.appendChild(dd);
    dl.appendChild(item);
  }

  // Índice do item destacado por campo (-1 = nenhum).
  var destaque = { origem: -1, destino: -1 };

  function obterEntrada(campo) {
    return document.getElementById("campo-" + campo);
  }

  function obterLista(campo) {
    return document.getElementById("sugestoes-" + campo);
  }

  // Aceita "origem"/"destino" ou o próprio elemento input.
  function resolverCampo(campo) {
    if (typeof campo === "string") {
      return CAMPOS_AUTOCOMPLETE.indexOf(campo) >= 0 ? campo : null;
    }
    if (campo && campo.id && campo.id.indexOf("campo-") === 0) {
      var nome = campo.id.slice("campo-".length);
      return CAMPOS_AUTOCOMPLETE.indexOf(nome) >= 0 ? nome : null;
    }
    return null;
  }

  function obterItensSelecionaveis(campo) {
    var lista = obterLista(campo);
    return lista ? Array.prototype.slice.call(lista.querySelectorAll("." + CLASSE_ITEM + ":not(." + CLASSE_VAZIO + ")")) : [];
  }

  function definirDestaque(campo, indice) {
    var entrada = obterEntrada(campo);
    var itens = obterItensSelecionaveis(campo);
    destaque[campo] = indice;
    itens.forEach(function (item, i) {
      var ativo = i === indice;
      item.classList.toggle(CLASSE_DESTACADO, ativo);
      item.setAttribute("aria-selected", ativo ? "true" : "false");
    });
    if (indice >= 0 && itens[indice]) {
      entrada.setAttribute("aria-activedescendant", itens[indice].id);
      if (typeof itens[indice].scrollIntoView === "function") {
        itens[indice].scrollIntoView({ block: "nearest" });
      }
    } else {
      entrada.removeAttribute("aria-activedescendant");
    }
  }

  function selecionarCidade(campo, cidade) {
    var entrada = obterEntrada(campo);
    entrada.value = cidade;
    Interface.fecharSugestoes(campo);
    entrada.focus();
  }

  function aoDigitar(campo) {
    // Síncrono, sem debounce: a lista aparece bem dentro de 200 ms.
    var entrada = obterEntrada(campo);
    var texto = entrada.value;
    if (texto.length < 2) {
      Interface.fecharSugestoes(campo);
      return;
    }
    Interface.exibirSugestoes(campo, Calculadora.filtrarCidades(texto));
  }

  var Interface = {
    inicializar: function () {
      IDS_SECOES_RESULTADO.forEach(function (id) {
        var secao = document.getElementById(id);
        if (secao) {
          secao.hidden = true;
        }
      });

      CAMPOS_AUTOCOMPLETE.forEach(function (campo) {
        var entrada = obterEntrada(campo);
        var lista = obterLista(campo);
        if (!entrada || !lista) {
          return;
        }
        entrada.addEventListener("input", function () {
          aoDigitar(campo);
        });
        entrada.addEventListener("keydown", function (evento) {
          Interface.tratarTecladoAutocomplete(evento);
        });
        entrada.addEventListener("blur", function () {
          Interface.fecharSugestoes(campo);
        });
        // Mantém o foco no campo ao clicar na lista (evita blur antes do click).
        lista.addEventListener("mousedown", function (evento) {
          evento.preventDefault();
        });
        lista.addEventListener("click", function (evento) {
          var alvo = evento.target;
          while (alvo && alvo !== lista && !(alvo.classList && alvo.classList.contains(CLASSE_ITEM))) {
            alvo = alvo.parentNode;
          }
          if (!alvo || alvo === lista || alvo.classList.contains(CLASSE_VAZIO)) {
            return;
          }
          selecionarCidade(campo, alvo.getAttribute("data-cidade"));
        });
      });
    },

    lerFormulario: function () {
      var marcado = document.querySelector('input[name="modal"]:checked');
      return {
        origem: obterEntrada("origem").value,
        destino: obterEntrada("destino").value,
        distanciaManual: document.getElementById("campo-distancia-manual").value,
        modal: marcado ? marcado.value : null,
      };
    },

    exibirSugestoes: function (campo, cidades) {
      var nome = resolverCampo(campo);
      if (!nome) {
        return;
      }
      var entrada = obterEntrada(nome);
      var lista = obterLista(nome);
      lista.textContent = "";

      if (!cidades || cidades.length === 0) {
        var vazio = document.createElement("li");
        vazio.className = CLASSE_ITEM + " " + CLASSE_VAZIO;
        vazio.setAttribute("role", "option");
        vazio.setAttribute("aria-disabled", "true");
        vazio.textContent = MENSAGEM_SEM_CIDADE;
        lista.appendChild(vazio);
      } else {
        cidades.forEach(function (cidade, i) {
          var item = document.createElement("li");
          item.className = CLASSE_ITEM;
          item.id = "sugestoes-" + nome + "-opcao-" + i;
          item.setAttribute("role", "option");
          item.setAttribute("aria-selected", "false");
          item.setAttribute("data-cidade", cidade);
          item.textContent = cidade;
          lista.appendChild(item);
        });
      }

      destaque[nome] = -1;
      entrada.removeAttribute("aria-activedescendant");
      lista.hidden = false;
      entrada.setAttribute("aria-expanded", "true");
    },

    fecharSugestoes: function (campo) {
      var nome = resolverCampo(campo);
      if (!nome) {
        return;
      }
      var entrada = obterEntrada(nome);
      var lista = obterLista(nome);
      lista.textContent = "";
      lista.hidden = true;
      destaque[nome] = -1;
      entrada.setAttribute("aria-expanded", "false");
      entrada.removeAttribute("aria-activedescendant");
    },

    tratarTecladoAutocomplete: function (evento) {
      var nome = resolverCampo(evento.target);
      if (!nome) {
        return;
      }
      var lista = obterLista(nome);
      if (!lista || lista.hidden) {
        return;
      }
      var itens = obterItensSelecionaveis(nome);
      var atual = destaque[nome];

      switch (evento.key) {
        case "ArrowDown":
          evento.preventDefault();
          if (itens.length > 0) {
            definirDestaque(nome, atual < itens.length - 1 ? atual + 1 : 0);
          }
          break;
        case "ArrowUp":
          evento.preventDefault();
          if (itens.length > 0) {
            definirDestaque(nome, atual > 0 ? atual - 1 : itens.length - 1);
          }
          break;
        case "Enter":
          if (atual >= 0 && itens[atual]) {
            evento.preventDefault();
            selecionarCidade(nome, itens[atual].getAttribute("data-cidade"));
          }
          break;
        case "Escape":
        case "Esc":
          evento.preventDefault();
          Interface.fecharSugestoes(nome);
          break;
        default:
          break;
      }
    },

    // Uma única mensagem por campo, na região role="alert" adjacente; substitui a anterior.
    exibirErro: function (campo, mensagem) {
      var regiao = obterRegiaoErro(campo);
      if (!regiao) {
        return;
      }
      var texto = String(mensagem === undefined || mensagem === null ? "" : mensagem);
      if (texto.length > MAX_CARACTERES_ERRO) {
        texto = texto.slice(0, MAX_CARACTERES_ERRO - 1) + "\u2026";
      }
      regiao.textContent = texto;
    },

    limparErro: function (campo) {
      var regiao = obterRegiaoErro(campo);
      if (regiao) {
        regiao.textContent = "";
      }
    },

    // dados: { distanciaKm, modal, emissaoKg } ou { erro: true } quando o cálculo falhou.
    exibirResultado: function (dados) {
      var secao = document.getElementById("secao-resultado");
      var conteudo = document.getElementById("resultado-conteudo");
      Interface.limparErro("resultado");
      conteudo.textContent = "";
      if (!dados || dados.erro) {
        Interface.exibirErro("resultado", MENSAGEM_CALCULO_FALHOU);
        secao.hidden = false;
        return;
      }
      adicionarItemDefinicao(conteudo, "resultado", "Distância", Calculadora.formatarDistancia(dados.distanciaKm) + " km");
      adicionarItemDefinicao(conteudo, "resultado", "Modal", ROTULOS_MODAL[dados.modal] || String(dados.modal));
      adicionarItemDefinicao(conteudo, "resultado", "Emissão de CO2", Calculadora.formatarEmissao(dados.emissaoKg) + " kg");
      secao.hidden = false;
    },

    // itens: resultado de Calculadora.compararModais (já ordenado).
    exibirComparacao: function (itens) {
      var secao = document.getElementById("secao-comparacao");
      var lista = document.getElementById("comparacao-conteudo");
      var mensagem = document.getElementById("comparacao-mensagem");
      lista.textContent = "";
      mensagem.textContent = "";
      var semEmissao = !itens || itens.length === 0 || itens.some(function (i) { return i.semEmissao; });
      if (semEmissao) {
        mensagem.textContent = MENSAGEM_SEM_COMPARACAO;
      }
      (itens || []).forEach(function (item) {
        var li = document.createElement("li");
        li.className = "comparacao__item";

        var rotulo = document.createElement("span");
        rotulo.className = "comparacao__rotulo";
        rotulo.textContent = ROTULOS_MODAL[item.modal] || String(item.modal);
        li.appendChild(rotulo);

        var valor = document.createElement("span");
        valor.className = "comparacao__valor";
        valor.textContent = Calculadora.formatarEmissao(item.emissaoKg) + " kg";
        li.appendChild(valor);

        if (!semEmissao && item.diferencaPct !== null && item.diferencaPct !== undefined) {
          var diferenca = document.createElement("span");
          diferenca.className = "comparacao__diferenca";
          diferenca.textContent = "+" + Calculadora.formatarNumero(item.diferencaPct, 1) + "%";
          li.appendChild(diferenca);
        }

        var trilho = document.createElement("span");
        trilho.className = "comparacao__trilho";
        var barra = document.createElement("span");
        barra.className = "comparacao__barra" + (item.larguraPct === 100 ? " comparacao__barra--maior" : "");
        barra.style.width = item.larguraPct + "%";
        trilho.appendChild(barra);
        li.appendChild(trilho);

        lista.appendChild(li);
      });
      secao.hidden = false;
    },

    // dados: { creditos, custo, erroPreco?, precoCredito?, emissaoZero?, erroEmissao? }
    exibirCreditos: function (dados) {
      var secao = document.getElementById("secao-creditos");
      var conteudo = document.getElementById("creditos-conteudo");
      var mensagem = document.getElementById("creditos-mensagem");
      var aviso = document.getElementById("creditos-aviso");
      Interface.limparErro("creditos");
      conteudo.textContent = "";
      mensagem.textContent = "";
      aviso.textContent = "";
      secao.hidden = false;

      if (!dados || dados.erroEmissao) {
        Interface.exibirErro("creditos", MENSAGEM_EMISSAO_INVALIDA);
        return;
      }

      adicionarItemDefinicao(conteudo, "creditos", "Créditos de carbono", Calculadora.formatarCreditos(dados.creditos));

      if (dados.erroPreco) {
        // Mantém os créditos na tela e informa o preço inválido, sem custo.
        Interface.exibirErro("creditos", MENSAGEM_PRECO_INVALIDO);
        return;
      }

      adicionarItemDefinicao(conteudo, "creditos", "Custo de compensação", "R$ " + Calculadora.formatarCusto(dados.custo));

      if (dados.creditos === 0 || dados.emissaoZero) {
        mensagem.textContent = MENSAGEM_SEM_EMISSAO_COMPENSAR;
      }

      var preco = dados.precoCredito;
      if (preco === undefined && typeof Configuracao !== "undefined") {
        preco = Configuracao.precoCredito;
      }
      var textoPreco = typeof preco === "number" ? " Preço usado: R$ " + Calculadora.formatarCusto(preco) + " por crédito (1 tonelada de CO2)." : "";
      aviso.textContent = "Valor estimado; o preço real pode variar." + textoPreco;
    },

    ocultarResultados: function () {
      IDS_SECOES_RESULTADO.forEach(function (id) {
        var secao = document.getElementById(id);
        if (secao) {
          secao.hidden = true;
        }
      });
      ["resultado-conteudo", "comparacao-conteudo", "creditos-conteudo",
        "comparacao-mensagem", "creditos-mensagem", "creditos-aviso",
        "erro-resultado", "erro-creditos"].forEach(function (id) {
        var elemento = document.getElementById(id);
        if (elemento) {
          elemento.textContent = "";
        }
      });
    },
  };

  if (typeof window !== "undefined") {
    window.Interface = Interface;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Interface;
  }
})();
