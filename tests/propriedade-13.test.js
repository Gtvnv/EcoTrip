"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fc = require("fast-check");

const Calculadora = require("../calculator.js");

// Oráculo independente: tabela explícita de acentos (não usa normalize()).
const MAPA = {
  "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
  "é": "e", "è": "e", "ê": "e", "ë": "e",
  "í": "i", "ì": "i", "î": "i",
  "ó": "o", "ò": "o", "ô": "o", "õ": "o",
  "ú": "u", "ù": "u", "û": "u", "ü": "u",
  "ç": "c"
};

function chave(texto) {
  let saida = "";
  for (const ch of texto.toLowerCase()) saida += MAPA[ch] || ch;
  return saida;
}

const ALFABETO = ["a", "A", "á", "Á", "ã", "e", "É", "ê", "i", "í", "o", "Ó", "õ", "u", "ú", "c", "Ç", "ç", "s", "n", "r", " ", "-"];
const palavraArb = fc.array(fc.constantFrom(...ALFABETO), { minLength: 1, maxLength: 8 }).map((a) => a.join(""));
// Listas com muitas colisões (acentos e duplicatas) e tamanho suficiente para passar de 10 resultados.
const cidadesArb = fc.array(palavraArb, { minLength: 0, maxLength: 40 }).chain((base) =>
  fc.array(base.length ? fc.constantFrom(...base) : palavraArb, { maxLength: 15 }).map((dups) => base.concat(dups))
);
const textoArb = fc.array(fc.constantFrom(...ALFABETO), { minLength: 0, maxLength: 4 }).map((a) => a.join(""));

function propriedade(texto, cidades) {
  const res = Calculadora.filtrarCidades(texto, cidades);
  const busca = chave(texto);

  if ([...texto].length < 2) {
    assert.deepStrictEqual(res, []);
    return;
  }

  const correspondentes = [...new Set(cidades.filter((c) => chave(c).includes(busca)))];
  assert.ok(res.length <= 10);
  assert.strictEqual(res.length, Math.min(10, correspondentes.length));
  assert.strictEqual(new Set(res).size, res.length, "sem duplicatas");
  for (const c of res) {
    assert.ok(cidades.includes(c));
    assert.ok(chave(c).includes(busca), "contém o texto: " + c);
  }
  for (let i = 1; i < res.length; i++) {
    assert.ok(chave(res[i - 1]) <= chave(res[i]), "ordem alfabética");
  }
  // Incluindo todas as correspondentes até o limite: as omitidas não vêm antes da última retornada.
  if (res.length > 0) {
    const ultima = chave(res[res.length - 1]);
    for (const c of correspondentes) {
      if (!res.includes(c)) assert.ok(chave(c) >= ultima, "omitida deveria vir depois: " + c);
    }
  }
}

// Feature: co2-trip-calculator, Property 13: Filtro de autocomplete
// **Validates: Requirements 2.1, 2.2**
test("Property 13: filtro de autocomplete (texto livre)", () => {
  fc.assert(fc.property(textoArb, cidadesArb, propriedade), { numRuns: 300 });
});

test("Property 13: filtro de autocomplete (texto extraído de uma cidade)", () => {
  const casoArb = cidadesArb.filter((l) => l.length > 0).chain((lista) =>
    fc.tuple(fc.constantFrom(...lista), fc.nat(), fc.integer({ min: 2, max: 4 }), fc.boolean()).map(([cidade, ini, tam, maiusc]) => {
      const i = ini % cidade.length;
      const sub = cidade.slice(i, i + tam);
      return [maiusc ? sub.toUpperCase() : sub, lista];
    })
  );
  fc.assert(fc.property(casoArb, ([texto, lista]) => propriedade(texto, lista)), { numRuns: 300 });
});

test("Property 13: exemplos de borda", () => {
  assert.deepStrictEqual(Calculadora.filtrarCidades("s", ["São Paulo"]), []);
  assert.deepStrictEqual(Calculadora.filtrarCidades("SAO", ["São Paulo", "São Paulo", "Osasco", "Vila Sao"]), ["São Paulo", "Vila Sao"]);
});
