"use strict";
// Feature: co2-trip-calculator, Property 5: Rota inexistente sinaliza erro
// **Validates: Requirements 3.4**
const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");

const Calculadora = require("../calculator.js");
const Base_de_Rotas = require("../rotas.js");

const NUM_RUNS = 200;

function cadastrado(a, b) {
  return Base_de_Rotas.distancias.some(
    (r) => (r.origem === a && r.destino === b) || (r.origem === b && r.destino === a)
  );
}

function verificarErro(fn) {
  let retorno;
  let erro;
  try {
    retorno = fn();
  } catch (e) {
    erro = e;
  }
  assert.equal(retorno, undefined, "nao deve retornar valor");
  assert.ok(erro instanceof Calculadora.ErroCalculadora, "deve lancar ErroCalculadora");
  assert.equal(erro.codigo, "ROTA_NAO_ENCONTRADA");
}

test("Property 5: strings arbitrarias nao cadastradas lancam ROTA_NAO_ENCONTRADA", () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (a, b) => {
      fc.pre(!cadastrado(a, b));
      verificarErro(() => Calculadora.obterDistancia(a, b));
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 5: par de cidades validas com o registro removido da base injetada", () => {
  const cidade = fc.constantFrom(...Base_de_Rotas.cidades);
  fc.assert(
    fc.property(cidade, cidade, fc.boolean(), (a, b, inverter) => {
      const base = {
        cidades: Base_de_Rotas.cidades,
        distancias: Base_de_Rotas.distancias.filter(
          (r) => !((r.origem === a && r.destino === b) || (r.origem === b && r.destino === a))
        ),
      };
      const [o, d] = inverter ? [b, a] : [a, b];
      verificarErro(() => Calculadora.obterDistancia(o, d, base));
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 5: base injetada vazia ou sem distancias sempre sinaliza erro", () => {
  const cidade = fc.constantFrom(...Base_de_Rotas.cidades);
  fc.assert(
    fc.property(cidade, cidade, fc.constantFrom({ distancias: [] }, {}, null), (a, b, base) => {
      verificarErro(() => Calculadora.obterDistancia(a, b, base));
    }),
    { numRuns: NUM_RUNS }
  );
});
