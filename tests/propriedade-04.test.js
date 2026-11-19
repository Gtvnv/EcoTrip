"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Base_de_Rotas = require("../rotas.js");
const Calculadora = require("../calculator.js");

// Feature: co2-trip-calculator, Property 4: Distância de rota cadastrada é a registrada e simétrica
// **Validates: Requirements 3.2, 3.3**
test("Property 4: Distância de rota cadastrada é a registrada e simétrica", () => {
  const registros = Base_de_Rotas.distancias;
  assert.ok(registros.length > 0, "Base_de_Rotas deve ter ao menos uma rota");

  fc.assert(
    fc.property(fc.constantFrom(...registros), (r) => {
      const ida = Calculadora.obterDistancia(r.origem, r.destino);
      const volta = Calculadora.obterDistancia(r.destino, r.origem);
      return ida === r.km && volta === r.km && ida === volta;
    }),
    { numRuns: 200 }
  );
});
