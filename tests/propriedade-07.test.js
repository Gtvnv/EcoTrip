"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Calculadora = require("../calculator.js");

function codigoDe(valor) {
  try {
    Calculadora.validarDistanciaManual(valor);
    return null;
  } catch (e) {
    assert.ok(e instanceof Calculadora.ErroCalculadora, "deve lançar ErroCalculadora");
    return e.codigo;
  }
}

// Feature: co2-trip-calculator, Property 7: Validação da distância manual
// **Validates: Requirements 4.2, 4.3, 4.4**
test("Property 7: Validação da distância manual", () => {
  const max = Calculadora.DISTANCIA_MAXIMA_KM;
  assert.strictEqual(max, 20000);

  // Válidos: número ou string numérica em (0, 20000]
  fc.assert(
    fc.property(fc.double({ min: 1e-6, max: 20000, noNaN: true }), fc.boolean(), (n, comoString) => {
      const entrada = comoString ? String(n) : n;
      return codigoDe(entrada) === null && Calculadora.validarDistanciaManual(entrada) === n;
    }),
    { numRuns: 200 }
  );

  // ≤ 0 → DISTANCIA_INVALIDA
  fc.assert(
    fc.property(fc.double({ min: -1e9, max: 0, noNaN: true }), fc.boolean(), (n, comoString) => {
      return codigoDe(comoString ? String(n) : n) === "DISTANCIA_INVALIDA";
    }),
    { numRuns: 200 }
  );

  // > 20000 → DISTANCIA_MAXIMA
  fc.assert(
    fc.property(fc.double({ min: 20000.0001, max: 1e9, noNaN: true }), fc.boolean(), (n, comoString) => {
      return codigoDe(comoString ? String(n) : n) === "DISTANCIA_MAXIMA";
    }),
    { numRuns: 200 }
  );

  // Vazio, não numérico, null e demais → DISTANCIA_INVALIDA
  const naoNumericas = fc
    .string()
    .filter((s) => s.trim() === "" || Number.isNaN(Number(s.trim())));
  fc.assert(
    fc.property(
      fc.oneof(
        naoNumericas,
        fc.constantFrom("", "   ", "abc", "12abc", "NaN", "Infinity", "-Infinity"),
        fc.constantFrom(null, undefined, NaN, Infinity, -Infinity)
      ),
      (v) => codigoDe(v) === "DISTANCIA_INVALIDA"
    ),
    { numRuns: 200 }
  );

  // Limites
  assert.strictEqual(codigoDe(0), "DISTANCIA_INVALIDA");
  assert.strictEqual(codigoDe(20000), null);
  assert.strictEqual(codigoDe("20000"), null);
  assert.strictEqual(codigoDe(20000.01), "DISTANCIA_MAXIMA");
});
