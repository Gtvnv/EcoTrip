"use strict";

// Testes de exemplo da Interface (ui.js) e da Aplicacao (app.js) com DOM simulado (jsdom).
// Requisitos: 2.3, 2.4, 2.5, 3.7, 5.6, 11.1, 11.2, 11.3.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const SCRIPTS = ["rotas.js", "config.js", "calculator.js", "ui.js", "app.js"];

// Carrega index.html no jsdom e executa os scripts da página na ordem de index.html.
function criarPagina() {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8").replace(/<script[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  // jsdom ainda está "loading": app.js registra iniciar() em DOMContentLoaded, que dispara no fim do parse.
  SCRIPTS.forEach((arquivo) => {
    window.eval(fs.readFileSync(path.join(RAIZ, arquivo), "utf8"));
  });
  if (window.document.readyState === "loading") {
    window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }
  return window;
}

function api(window) {
  const doc = window.document;
  const $ = (id) => doc.getElementById(id);
  return {
    window,
    $,
    digitar(campo, texto) {
      const entrada = $("campo-" + campo);
      entrada.focus();
      entrada.value = texto;
      entrada.dispatchEvent(new window.Event("input", { bubbles: true }));
    },
    tecla(campo, key) {
      const evento = new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      $("campo-" + campo).dispatchEvent(evento);
      return evento;
    },
    modal(valor) {
      $("modal-" + valor).checked = true;
    },
    manual(valor) {
      const campo = $("campo-distancia-manual");
      campo.value = valor;
      campo.dispatchEvent(new window.Event("input", { bubbles: true }));
    },
    calcular() {
      $("formulario-viagem").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    },
    erro(campo) {
      return $("erro-" + campo).textContent;
    },
    itens(campo) {
      return Array.from($("sugestoes-" + campo).querySelectorAll("li"));
    },
    secoesOcultas() {
      return ["secao-resultado", "secao-comparacao", "secao-creditos"].map((id) => $(id).hidden);
    },
  };
}

function nova() {
  return api(criarPagina());
}

test("página carrega com as três seções de resultado ocultas", () => {
  const p = nova();
  assert.deepEqual(p.secoesOcultas(), [true, true, true]);
});

test("origem = destino exibe mensagem e não chama obterDistancia (Req. 3.7)", () => {
  const p = nova();
  let chamadas = 0;
  const original = p.window.Calculadora.obterDistancia;
  p.window.Calculadora.obterDistancia = function (...args) {
    chamadas += 1;
    return original.apply(this, args);
  };
  p.digitar("origem", "São Paulo");
  p.digitar("destino", "São Paulo");
  p.modal("carro");
  p.calcular();
  assert.equal(p.erro("destino"), "Origem e destino devem ser diferentes");
  assert.equal(chamadas, 0);
  assert.deepEqual(p.secoesOcultas(), [true, true, true]);
  assert.equal(p.$("campo-origem").value, "São Paulo");
});

test("sem modal e sem distância exibe as duas mensagens e mantém seções ocultas (Req. 5.6)", () => {
  const p = nova();
  p.calcular();
  assert.equal(p.erro("modal"), "Selecione um modal de transporte");
  assert.equal(p.erro("origem"), "Informe origem e destino ou a distância manual");
  assert.equal(p.erro("destino"), "Informe origem e destino ou a distância manual");
  assert.deepEqual(p.secoesOcultas(), [true, true, true]);
});

test('"Nenhuma cidade encontrada" é item não selecionável (Req. 2.4)', () => {
  const p = nova();
  p.digitar("origem", "zzzz");
  const itens = p.itens("origem");
  assert.equal(itens.length, 1);
  assert.equal(itens[0].textContent, "Nenhuma cidade encontrada");
  assert.equal(itens[0].getAttribute("aria-disabled"), "true");

  itens[0].dispatchEvent(new p.window.MouseEvent("click", { bubbles: true }));
  assert.equal(p.$("campo-origem").value, "zzzz");

  p.tecla("origem", "ArrowDown");
  p.tecla("origem", "Enter");
  assert.equal(p.$("campo-origem").value, "zzzz");
  assert.equal(p.$("campo-origem").hasAttribute("aria-activedescendant"), false);
});

test("setas movem o destaque e Enter seleciona (Req. 2.5)", () => {
  const p = nova();
  p.digitar("origem", "sao");
  const itens = p.itens("origem");
  assert.ok(itens.length >= 1);
  assert.equal(p.$("sugestoes-origem").hidden, false);

  p.tecla("origem", "ArrowDown");
  assert.ok(itens[0].classList.contains("sugestoes__item--destacado"));
  assert.equal(p.$("campo-origem").getAttribute("aria-activedescendant"), itens[0].id);

  if (itens.length > 1) {
    p.tecla("origem", "ArrowDown");
    assert.ok(itens[1].classList.contains("sugestoes__item--destacado"));
    assert.ok(!itens[0].classList.contains("sugestoes__item--destacado"));
    p.tecla("origem", "ArrowUp");
    assert.ok(itens[0].classList.contains("sugestoes__item--destacado"));
  }

  const cidade = itens[0].getAttribute("data-cidade");
  p.tecla("origem", "Enter");
  assert.equal(p.$("campo-origem").value, cidade);
  assert.equal(p.$("sugestoes-origem").hidden, true);
  assert.equal(p.window.document.activeElement, p.$("campo-origem"));
});

test("Esc fecha as sugestões sem alterar o texto (Req. 2.5)", () => {
  const p = nova();
  p.digitar("destino", "rio");
  assert.equal(p.$("sugestoes-destino").hidden, false);
  p.tecla("destino", "ArrowDown");
  p.tecla("destino", "Escape");
  assert.equal(p.$("sugestoes-destino").hidden, true);
  assert.equal(p.$("campo-destino").value, "rio");
  assert.equal(p.window.document.activeElement, p.$("campo-destino"));
});

test("uma mensagem por campo, substituída ao revalidar, com até 120 caracteres (Req. 11.1 a 11.3)", () => {
  const p = nova();
  p.calcular();
  const anteriorDestino = p.erro("destino");
  assert.equal(anteriorDestino, "Informe origem e destino ou a distância manual");

  // Revalida com outro erro no mesmo campo: a mensagem é substituída, não acrescentada.
  p.digitar("origem", "São Paulo");
  p.digitar("destino", "São Paulo");
  p.modal("carro");
  p.calcular();
  assert.equal(p.erro("destino"), "Origem e destino devem ser diferentes");
  assert.equal(p.erro("origem"), "");
  assert.equal(p.erro("modal"), "");

  // Corrigido: mensagem removida.
  p.digitar("destino", "Rio de Janeiro");
  p.calcular();
  assert.equal(p.erro("destino"), "");

  // Distância manual inválida e rota inexistente também respeitam o limite e a unicidade.
  p.digitar("destino", "Cidade Inexistente");
  p.calcular();
  p.manual("30000");
  p.calcular();
  p.manual("-1");
  p.calcular();
  p.manual("");
  p.calcular();

  const regioes = Array.from(p.window.document.querySelectorAll(".formulario__erro"));
  regioes.forEach((regiao) => {
    assert.ok(regiao.textContent.length <= 120);
    assert.equal(regiao.children.length, 0);
    assert.equal(regiao.getAttribute("role"), "alert");
  });
});

test("mensagens de erro da distância manual são substituídas e têm até 120 caracteres", () => {
  const p = nova();
  p.modal("carro");
  p.manual("30000");
  p.calcular();
  assert.equal(p.erro("distancia-manual"), "A distância máxima é 20000 km");
  p.manual("-5");
  p.calcular();
  assert.equal(p.erro("distancia-manual"), "Informe uma distância válida em km");
  assert.ok(p.erro("distancia-manual").length <= 120);
});

test("cálculo válido São Paulo → Rio de Janeiro de carro mostra as três seções", () => {
  const p = nova();
  p.digitar("origem", "São Paulo");
  p.digitar("destino", "Rio de Janeiro");
  p.modal("carro");
  p.calcular();
  assert.deepEqual(p.secoesOcultas(), [false, false, false]);
  assert.match(p.$("resultado-conteudo").textContent, /430,0 km/);
  assert.match(p.$("resultado-conteudo").textContent, /Carro/);
  assert.equal(p.$("comparacao-conteudo").children.length, 4);
  assert.ok(p.$("creditos-conteudo").textContent.includes("R$"));
  ["origem", "destino", "modal", "geral"].forEach((c) => assert.equal(p.erro(c), ""));
});

test("alterar a distância manual atualiza e oculta os resultados (Req. 4.6)", () => {
  const p = nova();
  p.modal("carro");
  p.manual("100");
  p.calcular();
  assert.deepEqual(p.secoesOcultas(), [false, false, false]);
  assert.match(p.$("resultado-conteudo").textContent, /100/);
  const antes = p.$("resultado-conteudo").textContent;

  p.manual("200");
  assert.deepEqual(p.secoesOcultas(), [false, false, false]);
  assert.match(p.$("resultado-conteudo").textContent, /200/);
  assert.notEqual(p.$("resultado-conteudo").textContent, antes);

  p.manual("0");
  assert.deepEqual(p.secoesOcultas(), [true, true, true]);
});
