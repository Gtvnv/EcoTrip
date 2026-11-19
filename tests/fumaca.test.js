"use strict";

// Testes de fumaça e verificações estáticas da EcoTrip.
// Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 3.6, 9.3, 9.4, 10.2, 10.3, 10.5, 12.7.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const SCRIPTS = ["rotas.js", "config.js", "calculator.js", "ui.js", "app.js"];
const ARQUIVOS_APP = ["index.html", "style.css", ...SCRIPTS];

const ler = (arquivo) => fs.readFileSync(path.join(RAIZ, arquivo), "utf8");
const BEM = /^[a-z]+(-[a-z]+)*(__[a-z]+(-[a-z]+)*)?(--[a-z]+(-[a-z]+)*)?$/;

function carregarIndex() {
  return new JSDOM(ler("index.html")).window.document;
}

// CSS sem comentários e sem o bloco :root.
function cssForaDoRoot() {
  return ler("style.css")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/:root\s*\{[^}]*\}/g, "");
}

test("index.html: estrutura semântica (Req. 1.1, 1.2)", () => {
  const doc = carregarIndex();
  assert.equal(doc.querySelectorAll("header").length, 1);
  assert.equal(doc.querySelectorAll("main").length, 1);
  assert.equal(doc.querySelectorAll("footer").length, 1);
  assert.equal(doc.querySelectorAll("main > section").length, 4);
  assert.equal(doc.querySelectorAll("section").length, 4);
});

test("index.html: seções de resultado, comparação e créditos ocultas; nenhum radio marcado (Req. 1.2, 1.4)", () => {
  const doc = carregarIndex();
  ["secao-resultado", "secao-comparacao", "secao-creditos"].forEach((id) => {
    assert.ok(doc.getElementById(id).hasAttribute("hidden"), `${id} deve ter hidden`);
  });
  assert.equal(doc.getElementById("secao-formulario").hasAttribute("hidden"), false);
  const radios = doc.querySelectorAll('input[type="radio"]');
  assert.equal(radios.length, 4);
  radios.forEach((r) => assert.equal(r.hasAttribute("checked"), false));
});

test("index.html: scripts na ordem rotas, config, calculator, ui, app (Req. 10.5)", () => {
  const doc = carregarIndex();
  const srcs = [...doc.querySelectorAll("script")].map((s) => s.getAttribute("src"));
  assert.deepEqual(srcs, SCRIPTS);
});

test("index.html e style.css: sem scripts ou CSS externos de terceiros (Req. 1.5, 10.5)", () => {
  const doc = carregarIndex();
  const externo = /^(https?:)?\/\//i;
  doc.querySelectorAll("script[src]").forEach((s) => assert.ok(!externo.test(s.getAttribute("src"))));
  doc.querySelectorAll("link[href]").forEach((l) => assert.ok(!externo.test(l.getAttribute("href"))));
  assert.equal(doc.querySelectorAll("script:not([src])").length, 0);
  assert.ok(!/@import|url\(\s*["']?(https?:)?\/\//i.test(ler("style.css")));
});

test("style.css: nenhuma cor literal fora do :root (Req. 1.3)", () => {
  const css = cssForaDoRoot();
  assert.ok(/:root\s*\{/.test(ler("style.css")), "bloco :root esperado");
  assert.ok(!/rgba?\(/i.test(css), "rgb( fora do :root");
  assert.ok(!/hsla?\(/i.test(css), "hsl( fora do :root");
  // Hex apenas dentro de declarações (evita confundir com seletores de id).
  const corpos = [...css.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).join(";");
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(corpos), "cor #hex fora do :root");
});

test("style.css e index.html: classes em BEM minúsculo com hífens (Req. 1.4)", () => {
  const css = cssForaDoRoot();
  const seletores = [...css.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => !s.startsWith("@"));
  const classesCss = new Set();
  seletores.forEach((s) => [...s.matchAll(/\.([A-Za-z_][\w-]*)/g)].forEach((m) => classesCss.add(m[1])));
  assert.ok(classesCss.size > 0);
  classesCss.forEach((c) => assert.match(c, BEM, `classe CSS fora do BEM: ${c}`));

  const doc = carregarIndex();
  doc.querySelectorAll("[class]").forEach((el) => {
    el.classList.forEach((c) => assert.match(c, BEM, `classe HTML fora do BEM: ${c}`));
  });
});

test("calculator.js: nenhuma referência a document (Req. 10.3)", () => {
  assert.ok(!/\bdocument\b/.test(ler("calculator.js")));
});

test("config.js: unidade e fonte comentadas em cada valor (Req. 9.3, 9.4)", () => {
  const linhas = ler("config.js").split(/\r?\n/);
  const valores = linhas.filter((l) => /^\s*\w+:\s*-?\d+(\.\d+)?,/.test(l));
  assert.equal(valores.length, 5, "quatro fatores e o preço do crédito");
  valores.forEach((l) => {
    const m = l.match(/\/\/\s*(.*)$/);
    assert.ok(m, `sem comentário: ${l.trim()}`);
    assert.match(m[1], /g CO2\/km|R\$ por tonelada/, `sem unidade: ${l.trim()}`);
    assert.match(m[1], /Fonte:/, `sem fonte: ${l.trim()}`);
    assert.match(m[1], /\b(19|20)\d{2}\b/, `sem ano da fonte: ${l.trim()}`);
  });
});

test(".gitignore: regras de .env, chaves e credenciais (Req. 12.7)", () => {
  const regras = ler(".gitignore").split(/\r?\n/).map((l) => l.trim());
  [".env", ".env.*", "*.pem", "*.key", "credentials*.json"].forEach((r) => {
    assert.ok(regras.includes(r), `regra ausente: ${r}`);
  });
});

test("arquivos da aplicação: nenhuma chave de API (Req. 3.6, 10.2)", () => {
  assert.equal(ARQUIVOS_APP.length, 7);
  const padroes = [
    /api[_-]?key/i,
    /apikey/i,
    /secret/i,
    /\btoken\b/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /\bsk-[A-Za-z0-9]{16,}/,
    /[A-Za-z0-9_-]{32,}/, // sequência longa suspeita de chave
  ];
  ARQUIVOS_APP.forEach((arquivo) => {
    const texto = ler(arquivo);
    padroes.forEach((p) => assert.ok(!p.test(texto), `${arquivo} casa ${p}`));
  });
});

test("globais: typeof dos cinco objetos é object após carregar a página (Req. 10.2)", () => {
  const html = ler("index.html").replace(/<script[^>]*><\/script>/g, "");
  const { window } = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
  SCRIPTS.forEach((arquivo) => window.eval(ler(arquivo)));
  ["Calculadora", "Interface", "Aplicacao", "Configuracao", "Base_de_Rotas"].forEach((nome) => {
    assert.equal(typeof window[nome], "object", `window.${nome}`);
    assert.notEqual(window[nome], null);
  });
});
