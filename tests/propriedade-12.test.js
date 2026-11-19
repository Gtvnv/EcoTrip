"use strict";
// Feature: co2-trip-calculator, Property 12: Diferença percentual em relação à menor emissão não nula
// **Validates: Requirements 7.5, 7.6, 7.7**
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Calculadora = require("../calculator.js");

const { compararModais } = Calculadora;
const NUM_RUNS = 200;

const distancia = fc.double({ min: 0.001, max: 20000, noNaN: true, noDefaultInfinity: true });
// Fator valido: 0 sobrerrepresentado; mínimo não nulo evita números subnormais.
const fatorArb = fc.oneof(
  { arbitrary: fc.constant(0), weight: 2 },
  { arbitrary: fc.double({ min: 0.001, max: 5000, noNaN: true, noDefaultInfinity: true }), weight: 4 }
);
const configArb = fc.record({
  fatoresEmissao: fc.record({
    bicicleta: fatorArb,
    carro: fatorArb,
    onibus: fatorArb,
    caminhao: fatorArb,
  }),
  precoCredito: fc.constant(50),
});
const configTodosZeroArb = fc.constant({
  fatoresEmissao: { bicicleta: 0, carro: 0, onibus: 0, caminhao: 0 },
  precoCredito: 50,
});

test("Property 12: diferencaPct = (emissão - menor não nula) / menor não nula * 100; null para emissão 0", () => {
  fc.assert(
    fc.property(distancia, configArb, (d, config) => {
      const resultado = compararModais(d, config);
      const positivas = resultado.map((i) => i.emissaoKg).filter((e) => e > 0);
      const menor = positivas.length > 0 ? Math.min(...positivas) : null;
      for (const item of resultado) {
        if (item.emissaoKg > 0) {
          const esperado = ((item.emissaoKg - menor) / menor) * 100;
          assert.equal(item.diferencaPct, esperado);
          assert.ok(item.diferencaPct >= 0);
        } else {
          assert.equal(item.diferencaPct, null);
        }
      }
      if (menor !== null) {
        // A menor emissão não nula tem diferença de exatamente 0%.
        const itemMenor = resultado.find((i) => i.emissaoKg === menor);
        assert.equal(itemMenor.diferencaPct, 0);
      }
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 12: quando todas as emissões são 0, semEmissao é verdadeiro e nenhum percentual é definido", () => {
  fc.assert(
    fc.property(distancia, configTodosZeroArb, (d, config) => {
      const resultado = compararModais(d, config);
      assert.equal(resultado.length, 4);
      assert.equal(resultado.semEmissao, true);
      for (const item of resultado) {
        assert.equal(item.emissaoKg, 0);
        assert.equal(item.semEmissao, true);
        assert.equal(item.diferencaPct, null);
      }
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 12: semEmissao é falso quando alguma emissão é positiva", () => {
  fc.assert(
    fc.property(distancia, configArb, (d, config) => {
      const resultado = compararModais(d, config);
      const algumaPositiva = resultado.some((i) => i.emissaoKg > 0);
      assert.equal(resultado.semEmissao, !algumaPositiva);
      for (const item of resultado) assert.equal(item.semEmissao, !algumaPositiva);
      if (!algumaPositiva) {
        for (const item of resultado) assert.equal(item.diferencaPct, null);
      }
    }),
    { numRuns: NUM_RUNS }
  );
});
