"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Base_de_Rotas = require("../rotas.js");
const Calculadora = require("../calculator.js");

// Feature: co2-trip-calculator, Property 8: Distância manual válida prevalece sobre a base
// **Validates: Requirements 5.5**
test("Property 8: Distância manual válida prevalece sobre a base", () => {
  const registros = Base_de_Rotas.distancias;
  const cidadeCadastrada = fc.constantFrom(...registros).chain((r) =>
    fc.constantFrom(r.origem, r.destino)
  );
  const cidade = fc.oneof(cidadeCadastrada, fc.string({ minLength: 0, maxLength: 20 }));
  const par = fc.oneof(
    fc.constantFrom(...registros).map((r) => [r.origem, r.destino]),
    fc.tuple(cidade, cidade)
  );
  const manual = fc.double({ min: 0, max: 20000, noNaN: true }).filter((v) => v > 0 && v <= 20000);

  fc.assert(
    fc.property(manual, par, (m, [origem, destino]) => {
      const r = Calculadora.resolverDistancia(origem, destino, m);
      return typeof r === "number" && r === m;
    }),
    { numRuns: 200 }
  );
});
