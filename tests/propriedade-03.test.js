"use strict";
// Feature: co2-trip-calculator, Property 3: Validação da configuração
// Validates: Requirements 9.1, 9.2, 9.5

const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Calculadora = require("../calculator.js");

const { validarConfiguracao, ErroCalculadora, MODAIS } = Calculadora;

// Ordem de verificação: 4 fatores, depois precoCredito.
const CAMPOS = MODAIS.map((m) => "fatoresEmissao." + m).concat("precoCredito");

// ---------- Geradores ----------

const fatorValido = fc.oneof(
  { weight: 1, arbitrary: fc.constant(0) },
  { weight: 4, arbitrary: fc.double({ min: 0, max: 5000, noNaN: true }) }
);

// preço válido: centavos inteiros em [1, 99999999] => (0, 999999.99] com ≤ 2 casas
const precoValido = fc
  .integer({ min: 1, max: 99999999 })
  .map((c) => c / 100);

const configValida = fc.record({
  fatoresEmissao: fc.record({
    bicicleta: fatorValido,
    carro: fatorValido,
    onibus: fatorValido,
    caminhao: fatorValido,
  }),
  precoCredito: precoValido,
});

const fatorInvalido = fc.oneof(
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.constant(undefined),
  fc.constant(null),
  fc.constant("10"),
  fc.constant(true),
  fc.double({ min: -1e6, max: 0, noNaN: true }).filter((v) => v < 0 && !Object.is(v, -0)),
  fc.constant(-Number.MIN_VALUE)
);

const precoInvalido = fc.oneof(
  fc.constant(0),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.constant(undefined),
  fc.constant(null),
  fc.constant("100"),
  fc.constant(1000000),
  fc.constant(999999.995),
  fc.double({ min: -1e6, max: -0.01, noNaN: true }),
  fc.double({ min: 1000000, max: 1e9, noNaN: true }).filter((v) => v > 999999.99),
  // mais de 2 casas decimais: m/1000 com m não múltiplo de 10
  fc
    .integer({ min: 1, max: 999999990 })
    .filter((m) => m % 10 !== 0)
    .map((m) => m / 1000)
);

// Mutação: para cada campo, decide se é substituído por um valor inválido.
const mutacao = fc.record({
  alvos: fc.array(fc.boolean(), { minLength: 5, maxLength: 5 }),
  fatoresRuins: fc.array(fatorInvalido, { minLength: 4, maxLength: 4 }),
  precoRuim: precoInvalido,
});

function aplicarMutacao(base, mut) {
  const cfg = {
    fatoresEmissao: Object.assign({}, base.fatoresEmissao),
    precoCredito: base.precoCredito,
  };
  MODAIS.forEach((m, i) => {
    if (mut.alvos[i]) cfg.fatoresEmissao[m] = mut.fatoresRuins[i];
  });
  if (mut.alvos[4]) cfg.precoCredito = mut.precoRuim;
  const primeiro = mut.alvos.findIndex(Boolean);
  return { cfg, esperado: primeiro === -1 ? null : CAMPOS[primeiro] };
}

// ---------- Teste ----------

test("Property 3: validarConfiguracao aceita sse a configuração é válida; senão aponta o primeiro item inválido", () => {
  fc.assert(
    fc.property(configValida, mutacao, (base, mut) => {
      // Configuração válida original é aceita
      validarConfiguracao(base);

      const { cfg, esperado } = aplicarMutacao(base, mut);
      if (esperado === null) {
        validarConfiguracao(cfg); // nenhuma mutação: continua válida
        return true;
      }
      let erro = null;
      try {
        validarConfiguracao(cfg);
      } catch (e) {
        erro = e;
      }
      assert.ok(erro instanceof ErroCalculadora, "deveria lançar ErroCalculadora para " + esperado);
      assert.equal(erro.parametro, esperado);
      return true;
    }),
    { numRuns: 200 }
  );
});

test("Property 3: limites do preço (exemplos de borda)", () => {
  const base = { fatoresEmissao: { bicicleta: 0, carro: 1, onibus: 2, caminhao: 3 } };
  validarConfiguracao(Object.assign({}, base, { precoCredito: 0.01 }));
  validarConfiguracao(Object.assign({}, base, { precoCredito: 999999.99 }));
  for (const p of [0, 1000000, 0.001, 1.005]) {
    assert.throws(
      () => validarConfiguracao(Object.assign({}, base, { precoCredito: p })),
      (e) => e instanceof ErroCalculadora && e.parametro === "precoCredito"
    );
  }
});
