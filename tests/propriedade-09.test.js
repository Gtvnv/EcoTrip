"use strict";
// Feature: co2-trip-calculator, Property 9: Créditos e custo são proporcionais à emissão
// **Validates: Requirements 8.1, 8.2, 8.6**
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Calculadora = require("../calculator.js");

const { calcularCreditos, calcularCustoCompensacao } = Calculadora;
const NUM_RUNS = 200;

// Emissão >= 0, com 0 sobrerrepresentado; mínimo não nulo evita números subnormais.
const emissaoArb = fc.oneof(
  { arbitrary: fc.constant(0), weight: 1 },
  { arbitrary: fc.double({ min: 0.001, max: 1e6, noNaN: true, noDefaultInfinity: true }), weight: 6 }
);
const emissaoPositivaArb = fc.double({ min: 0.001, max: 1e6, noNaN: true, noDefaultInfinity: true });
const precoArb = fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true });

function proximo(a, b) {
  return Math.abs(a - b) <= 1e-12 * Math.max(Math.abs(a), Math.abs(b));
}

test("Property 9: créditos = emissão / 1000 e custo = emissão * preço / 1000", () => {
  fc.assert(
    fc.property(emissaoArb, precoArb, (e, preco) => {
      const config = { precoCredito: preco };
      const creditos = calcularCreditos(e);
      assert.equal(creditos, e / 1000);
      const custo = calcularCustoCompensacao(creditos, config);
      assert.ok(custo >= 0);
      assert.ok(proximo(custo, (e * preco) / 1000), `${custo} != ${(e * preco) / 1000}`);
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 9: razão custo/emissão = preço / 1000 para emissão > 0", () => {
  fc.assert(
    fc.property(emissaoPositivaArb, precoArb, (e, preco) => {
      const custo = calcularCustoCompensacao(calcularCreditos(e), { precoCredito: preco });
      assert.ok(proximo(custo / e, preco / 1000), `${custo / e} != ${preco / 1000}`);
    }),
    { numRuns: NUM_RUNS }
  );
});
