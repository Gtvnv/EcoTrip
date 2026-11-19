"use strict";
// Feature: co2-trip-calculator, Property 11: Comparação completa, ordenada e consistente
// **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Calculadora = require("../calculator.js");

const { MODAIS, calcularEmissao, compararModais } = Calculadora;
const NUM_RUNS = 200;

const distancia = fc.double({ min: 0.001, max: 20000, noNaN: true, noDefaultInfinity: true });
const fatorArb = fc.oneof(
  { arbitrary: fc.constant(0), weight: 2 },
  { arbitrary: fc.integer({ min: 1, max: 5 }), weight: 2 }, // valores pequenos favorecem empates
  { arbitrary: fc.double({ min: 0.001, max: 5000, noNaN: true, noDefaultInfinity: true }), weight: 3 }
);
const montar = (f) => ({
  fatoresEmissao: { bicicleta: f[0], carro: f[1], onibus: f[2], caminhao: f[3] },
  precoCredito: 50,
});
const fatoresArb = fc.tuple(fatorArb, fatorArb, fatorArb, fatorArb);
// Configs onde todos os fatores são iguais (inclusive todos zero).
const iguaisArb = fatorArb.map((f) => [f, f, f, f]);
const configArb = fc.oneof(fatoresArb, iguaisArb).map(montar);

test("Property 11: comparação completa, ordenada e consistente", () => {
  fc.assert(
    fc.property(distancia, configArb, (d, config) => {
      const res = compararModais(d, config);

      // 7.1: exatamente os quatro modais, sem repetição.
      assert.equal(res.length, MODAIS.length);
      assert.deepEqual([...res.map((i) => i.modal)].sort(), [...MODAIS].sort());

      // emissaoKg = calcularEmissao
      for (const item of res) {
        assert.equal(item.emissaoKg, calcularEmissao(d, item.modal, config));
      }

      // 7.2: ordem crescente, desempate pela ordem de MODAIS.
      for (let i = 1; i < res.length; i++) {
        const a = res[i - 1];
        const b = res[i];
        assert.ok(a.emissaoKg <= b.emissaoKg);
        if (a.emissaoKg === b.emissaoKg) {
          assert.ok(MODAIS.indexOf(a.modal) < MODAIS.indexOf(b.modal));
        }
      }

      // 7.3 / 7.4: larguraPct
      const max = Math.max(...res.map((i) => i.emissaoKg));
      for (const item of res) {
        const esperado = max === 0 ? 0 : Math.round((item.emissaoKg / max) * 100);
        assert.equal(item.larguraPct, esperado);
        assert.ok(Number.isFinite(item.larguraPct));
      }

      // 7.6: maior emissão tem larguraPct 100 quando max > 0.
      if (max > 0) {
        const maiores = res.filter((i) => i.emissaoKg === max);
        assert.ok(maiores.length >= 1);
        for (const m of maiores) assert.equal(m.larguraPct, 100);
      }
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 11: fatores todos iguais preservam a ordem de MODAIS", () => {
  fc.assert(
    fc.property(distancia, iguaisArb, (d, f) => {
      const res = compararModais(d, montar(f));
      assert.deepEqual(res.map((i) => i.modal), [...MODAIS]);
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 11: todos os fatores zero resultam em larguraPct 0 sem divisão por zero", () => {
  fc.assert(
    fc.property(distancia, (d) => {
      const res = compararModais(d, montar([0, 0, 0, 0]));
      for (const item of res) {
        assert.equal(item.emissaoKg, 0);
        assert.equal(item.larguraPct, 0);
      }
    }),
    { numRuns: NUM_RUNS }
  );
});
