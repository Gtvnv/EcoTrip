"use strict";
// Feature: co2-trip-calculator, Property 1: Emissão é distância vezes fator dividido por 1000
// **Validates: Requirements 6.2, 6.3, 6.5, 6.7, 9.6**
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Calculadora = require("../calculator.js");

const { MODAIS, calcularEmissao } = Calculadora;
const NUM_RUNS = 200;

const distancia = fc.double({ min: 0.001, max: 10000, noNaN: true, noDefaultInfinity: true });
const modalArb = fc.constantFrom(...MODAIS);
// Fator valido: >= 0, com 0 sobrerrepresentado.
const fatorArb = fc.oneof(
  { arbitrary: fc.constant(0), weight: 1 },
  // Mínimo não nulo de 0,001 g/km evita números subnormais, onde o ponto flutuante sofre underflow.
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

function proximo(a, b) {
  const tol = 1e-12 * Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tol;
}

test("Property 1: emissão = d * fator / 1000, >= 0 e 0 com fator 0", () => {
  fc.assert(
    fc.property(distancia, modalArb, configArb, (d, modal, config) => {
      const fator = config.fatoresEmissao[modal];
      const emissao = calcularEmissao(d, modal, config);
      assert.equal(emissao, (d * fator) / 1000);
      assert.ok(emissao >= 0);
      if (fator === 0) assert.equal(emissao, 0);
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 1: o dobro da distância dobra a emissão", () => {
  fc.assert(
    fc.property(distancia, modalArb, configArb, (d, modal, config) => {
      const simples = calcularEmissao(d, modal, config);
      const dobro = calcularEmissao(2 * d, modal, config);
      assert.ok(proximo(dobro, 2 * simples), `${dobro} != 2*${simples}`);
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Property 1: alterar o fator na configuração reflete no novo cálculo", () => {
  fc.assert(
    fc.property(distancia, modalArb, configArb, fatorArb, (d, modal, config, novoFator) => {
      const antes = calcularEmissao(d, modal, config);
      const nova = {
        ...config,
        fatoresEmissao: { ...config.fatoresEmissao, [modal]: novoFator },
      };
      const depois = calcularEmissao(d, modal, nova);
      assert.equal(depois, (d * novoFator) / 1000);
      // A configuração original não é afetada.
      assert.equal(calcularEmissao(d, modal, config), antes);
    }),
    { numRuns: NUM_RUNS }
  );
});
