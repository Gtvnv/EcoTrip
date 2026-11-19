// Testes unitarios da Calculadora (exemplos e casos de borda).
// Requisitos: 6.3, 6.4, 8.3, 8.4, 8.7, 10.4
const test = require("node:test");
const assert = require("node:assert/strict");
const Calculadora = require("../calculator.js");
const Configuracao = require("../config.js");

test("100 km de carro com a Configuracao real: 17,00 kg, 0,0170 creditos, R$ 0,85", () => {
  const kg = Calculadora.calcularEmissao(100, "carro", Configuracao);
  const { creditos, custo } = Calculadora.calcularCompensacao(kg, Configuracao);
  assert.equal(Calculadora.formatarEmissao(kg), "17,00");
  assert.equal(Calculadora.formatarCreditos(creditos), "0,0170");
  assert.equal(Calculadora.formatarCusto(custo), "0,85");
});

test("bicicleta: 0,00 kg, 0,0000 creditos, R$ 0,00", () => {
  const kg = Calculadora.calcularEmissao(100, "bicicleta", Configuracao);
  const { creditos, custo } = Calculadora.calcularCompensacao(kg, Configuracao);
  assert.equal(Calculadora.formatarEmissao(kg), "0,00");
  assert.equal(Calculadora.formatarCreditos(creditos), "0,0000");
  assert.equal(Calculadora.formatarCusto(custo), "0,00");
});

test("123,45 kg exibem 0,1235 creditos", () => {
  const { creditos } = Calculadora.calcularCompensacao(123.45, Configuracao);
  assert.equal(Calculadora.formatarCreditos(creditos), "0,1235");
});

test("distancia 1234.5 e formatada como 1.234,5", () => {
  assert.equal(Calculadora.formatarDistancia(1234.5), "1.234,5");
});

test("preco invalido mantem os creditos e devolve erroPreco", () => {
  const configInvalida = { fatoresEmissao: Configuracao.fatoresEmissao, precoCredito: 0 };
  const r = Calculadora.calcularCompensacao(17, configInvalida);
  assert.equal(Calculadora.formatarCreditos(r.creditos), "0,0170");
  assert.equal(r.custo, null);
  assert.ok(r.erroPreco instanceof Calculadora.ErroCalculadora);
  assert.equal(r.erroPreco.parametro, "precoCredito");
});

test("chamadas da Calculadora retornam em menos de 100 ms", () => {
  const inicio = process.hrtime.bigint();
  const kg = Calculadora.calcularEmissao(100, "carro", Configuracao);
  const { creditos, custo } = Calculadora.calcularCompensacao(kg, Configuracao);
  Calculadora.compararModais(100, Configuracao);
  Calculadora.formatarEmissao(kg);
  Calculadora.formatarCreditos(creditos);
  Calculadora.formatarCusto(custo);
  Calculadora.formatarDistancia(1234.5);
  const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
  assert.ok(ms < 100, "levou " + ms + " ms");
});
