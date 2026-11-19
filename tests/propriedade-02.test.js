"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");

const Calculadora = require("../calculator.js");
const Configuracao = require("../config.js");

const { ErroCalculadora, MODAIS, DISTANCIA_MAXIMA_KM } = Calculadora;

// Valores nao numericos ou fora do dominio, comuns a varios parametros.
const naoNumerico = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
  fc.boolean(),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.array(fc.integer(), { maxLength: 2 })
);
const negativo = fc.double({ max: -Number.MIN_VALUE, noNaN: true });

const distanciaInvalida = fc.oneof(
  naoNumerico,
  negativo,
  fc.constant(0),
  fc.double({ min: DISTANCIA_MAXIMA_KM + 0.01, max: 1e12, noNaN: true })
);
const emissaoInvalida = fc.oneof(naoNumerico, negativo);
const creditosInvalidos = fc.oneof(naoNumerico, negativo);
const precoInvalido = fc.oneof(
  naoNumerico,
  negativo,
  fc.constant(0)
);
const modalValido = fc.constantFrom(...MODAIS);
const distanciaValida = fc.double({ min: 0.01, max: DISTANCIA_MAXIMA_KM, noNaN: true });

function instantaneo(config) {
  return JSON.parse(JSON.stringify(config));
}

// Executa fn e exige ErroCalculadora com o parametro esperado, sem valor de retorno.
function exigirErro(fn, parametro) {
  let retorno;
  let erro;
  try {
    retorno = fn();
  } catch (e) {
    erro = e;
  }
  assert.ok(erro instanceof ErroCalculadora, "deveria lancar ErroCalculadora; retornou " + String(retorno));
  assert.equal(erro.parametro, parametro);
}

test("Feature: co2-trip-calculator, Property 2: Entradas inválidas são rejeitadas com identificação do parâmetro", () => {
  const configInicial = instantaneo(Configuracao);

  fc.assert(
    fc.property(
      fc.constantFrom("distancia", "modal", "fator", "emissao", "creditos", "preco"),
      distanciaInvalida,
      emissaoInvalida,
      creditosInvalidos,
      precoInvalido,
      modalValido,
      distanciaValida,
      fc.double({ min: 0, max: 5000, noNaN: true }),
      fc.oneof(naoNumerico, negativo),
      (caso, distInv, emiInv, credInv, precoInv, modal, distOk, fatorOk, fatorInvalido) => {
        // Configuracao valida injetada, com um item invalido conforme o caso.
        const config = {
          fatoresEmissao: { bicicleta: fatorOk, carro: fatorOk, onibus: fatorOk, caminhao: fatorOk },
          precoCredito: 50,
        };
        const antesGlobal = instantaneo(Configuracao);
        let antesLocal;

        switch (caso) {
          case "distancia":
            antesLocal = instantaneo(config);
            exigirErro(() => Calculadora.calcularEmissao(distInv, modal), "distanciaKm");
            exigirErro(() => Calculadora.calcularEmissao(distInv, modal, config), "distanciaKm");
            break;
          case "modal": {
            // Modal ausente da configuracao: fator indefinido.
            antesLocal = instantaneo(config);
            const modalInvalido = "x" + String(distOk);
            exigirErro(
              () => Calculadora.calcularEmissao(distOk, modalInvalido, config),
              "fatoresEmissao." + modalInvalido
            );
            exigirErro(() => Calculadora.calcularEmissao(distOk, undefined, config), "fatoresEmissao.undefined");
            break;
          }
          case "fator": {
            // Fator do modal ausente, nao numerico ou negativo.
            const configRuim = instantaneo(config);
            if (fatorInvalido === undefined) delete configRuim.fatoresEmissao[modal];
            else configRuim.fatoresEmissao[modal] = fatorInvalido;
            // JSON converte NaN/Infinity em null, tambem invalido.
            antesLocal = instantaneo(configRuim);
            exigirErro(() => Calculadora.calcularEmissao(distOk, modal, configRuim), "fatoresEmissao." + modal);
            assert.deepStrictEqual(instantaneo(configRuim), antesLocal);
            break;
          }
          case "emissao":
            antesLocal = instantaneo(config);
            exigirErro(() => Calculadora.calcularCreditos(emiInv), "emissaoKg");
            break;
          case "creditos":
            antesLocal = instantaneo(config);
            exigirErro(() => Calculadora.calcularCustoCompensacao(credInv, config), "creditos");
            exigirErro(() => Calculadora.calcularCustoCompensacao(credInv), "creditos");
            break;
          case "preco": {
            const configRuim = { fatoresEmissao: config.fatoresEmissao, precoCredito: precoInv };
            antesLocal = instantaneo(configRuim);
            exigirErro(() => Calculadora.calcularCustoCompensacao(1.5, configRuim), "precoCredito");
            // Preco ausente.
            const semPreco = { fatoresEmissao: config.fatoresEmissao };
            exigirErro(() => Calculadora.calcularCustoCompensacao(1.5, semPreco), "precoCredito");
            assert.deepStrictEqual(instantaneo(configRuim), antesLocal);
            break;
          }
        }

        // A Configuracao global nunca e alterada.
        assert.deepStrictEqual(instantaneo(Configuracao), antesGlobal);
        if (caso !== "preco" && caso !== "fator") {
          assert.deepStrictEqual(instantaneo(config), antesLocal);
        }
      }
    ),
    { numRuns: 200 }
  );

  assert.deepStrictEqual(instantaneo(Configuracao), configInicial);
});
