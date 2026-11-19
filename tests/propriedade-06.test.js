"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Base_de_Rotas = require("../rotas.js");

// Feature: co2-trip-calculator, Property 6: Dados da Base_de_Rotas são válidos
// **Validates: Requirements 3.1**
test("Property 6: Dados da Base_de_Rotas são válidos", () => {
  const registros = Base_de_Rotas.distancias;
  const cidades = Base_de_Rotas.cidades;
  assert.ok(registros.length > 0, "Base_de_Rotas deve ter ao menos uma rota");

  fc.assert(
    fc.property(fc.constantFrom(...registros), (r) => {
      const kmValido =
        typeof r.km === "number" &&
        Number.isFinite(r.km) &&
        r.km > 0 &&
        r.km <= 10000 &&
        Math.abs(r.km * 10 - Math.round(r.km * 10)) < 1e-9;
      return kmValido && cidades.includes(r.origem) && cidades.includes(r.destino);
    }),
    { numRuns: 200 }
  );
});
