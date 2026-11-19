"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Calculadora = require("../calculator.js");

const EPS = 1e-9;
const valorArb = fc.oneof(
  fc.double({ min: 0, max: 1e9, noNaN: true }),
  fc.integer({ min: 0, max: 1e8 }).map((i) => i / 1000), // inclui empates como x,xx5
  fc.integer({ min: 0, max: 1e8 }).map((i) => i / 100000)
);
const casasArb = fc.constantFrom(1, 2, 4);

function voltar(texto) {
  return Number(texto.replace(/\./g, "").replace(",", "."));
}

// Feature: co2-trip-calculator, Property 10: Formatação pt-BR e arredondamento meio para cima
// **Validates: Requirements 6.4, 8.3**
test("Property 10: formato pt-BR, n casas e proximidade do arredondado", () => {
  fc.assert(
    fc.property(valorArb, casasArb, (valor, n) => {
      const sem = Calculadora.formatarNumero(valor, n);
      assert.match(sem, new RegExp("^\\d+,\\d{" + n + "}$"));
      const arred = Calculadora.arredondarMeioParaCima(valor, n);
      assert.ok(Math.abs(voltar(sem) - arred) <= Math.pow(10, -n) / 2 + EPS);

      const com = Calculadora.formatarNumero(valor, n, true);
      assert.match(com, new RegExp("^\\d{1,3}(\\.\\d{3})*,\\d{" + n + "}$"));
      assert.ok(Math.abs(voltar(com) - arred) <= Math.pow(10, -n) / 2 + EPS);
    }),
    { numRuns: 300 }
  );
});

test("Property 10: emissão, créditos e custo correspondem ao valor arredondado", () => {
  fc.assert(
    fc.property(valorArb, (valor) => {
      const casos = [
        [Calculadora.formatarEmissao(valor), 2],
        [Calculadora.formatarCreditos(valor), 4],
        [Calculadora.formatarCusto(valor), 2],
      ];
      for (const [texto, n] of casos) {
        const arred = Calculadora.arredondarMeioParaCima(valor, n);
        assert.match(texto, new RegExp("^\\d+,\\d{" + n + "}$"));
        assert.ok(Math.abs(voltar(texto) - arred) <= EPS);
      }
    }),
    { numRuns: 300 }
  );
});

test("Property 10: exemplos de borda", () => {
  assert.strictEqual(Calculadora.formatarNumero(1.005, 2), "1,01");
  assert.strictEqual(Calculadora.formatarEmissao(1.005), "1,01");
  assert.strictEqual(Calculadora.formatarCreditos(123.45 / 1000), "0,1235");
  assert.strictEqual(Calculadora.formatarNumero(1234567.891, 2, true), "1.234.567,89");
  assert.strictEqual(Calculadora.formatarNumero(0, 4), "0,0000");
});
