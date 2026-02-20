# Plano — KNN Ponderado (Inverse Distance Weighting)

## Problema atual

O `getPriceSuggestionKnn` atual usa **média simples** dos K=10 vizinhos:

```
resultado = soma(preços dos K vizinhos) / K
```

Isso ignora o quão próximo cada vizinho é da consulta. Um match quase perfeito
(distância ≈ 0) tem o mesmo peso que um vizinho distante, diluindo o resultado.

**Exemplo concreto:**
- Query: MEDIUM + HIGH + RIB
- Match quase perfeito: MEDIUM + HIGH + COLLARBONE = R$650 (distância ≈ 0)
- 9 vizinhos mais distantes: média ≈ R$380
- Resultado atual (média simples): **R$440** — errado
- Resultado esperado (ponderado): **≈ R$648** — correto

---

## Solução: Inverse Distance Weighting (IDW)

### Fórmula

```
peso_i    = 1 / distância_i²
resultado = soma(peso_i × preço_i) / soma(peso_i)
```

Quanto menor a distância, maior o peso. Um vizinho com distância ≈ 0 domina
completamente o resultado.

### Tratamento do match exato (distância = 0)

Se houver um ou mais vizinhos com distância 0 (match perfeito nos três campos),
apenas eles são usados — os demais são ignorados.

```
se distância_i == 0:
    resultado = média dos vizinhos com distância 0
```

### Parâmetro de suavização (epsilon)

Para evitar divisão por zero quando distância é muito pequena mas não zero:

```
peso_i = 1 / (distância_i² + ε)
ε = 0.0001  (constante pequena)
```

---

## Comportamento esperado

### Caso 1: Match quase perfeito

Query: `MEDIUM + HIGH + RIB (nível 3)`

| Entrada | Distância | Peso (1/dist²) | Preço |
|---------|-----------|-----------------|-------|
| MEDIUM + HIGH + COLLARBONE | 0.00 | 100.000 | R$650 |
| SMALL + HIGH + RIB | 0.20 | 25 | R$450 |
| SMALL + HIGH + RIB | 0.20 | 25 | R$400 |
| SMALL + MEDIUM + RIB | 0.39 | 6.6 | R$450 |
| ... | ... | ... | ... |

Resultado ponderado: **≈ R$648** ✓

### Caso 2: Mudando complexidade para MEDIUM

Query: `MEDIUM + MEDIUM + RIB (nível 3)`

O match mais próximo agora é `SMALL + MEDIUM + RIB = R$450`, distância ≈ 0.2.
O R$650 (MEDIUM + HIGH + COLLARBONE) fica mais distante (distância ≈ 0.33).

Resultado ponderado: **≈ R$420–R$450** — abaixo de R$650, como esperado ✓

---

## O que muda no código

### Backend — único arquivo

**`backend/src/sessions/sessions.service.ts`** — método `getPriceSuggestionKnn`

Substituir:
```typescript
// Atual: média simples
const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
```

Por:
```typescript
// Novo: IDW
const EPS = 0.0001;
const perfectMatches = candidates.filter(c => c.dist === 0);

let weightedAvg: number;
if (perfectMatches.length > 0) {
  // Match perfeito: usa só eles
  weightedAvg = Math.round(
    perfectMatches.reduce((s, c) => s + c.finalPrice, 0) / perfectMatches.length
  );
} else {
  const totalWeight = candidates.reduce((s, c) => s + 1 / (c.dist ** 2 + EPS), 0);
  weightedAvg = Math.round(
    candidates.reduce((s, c) => s + (c.finalPrice / (c.dist ** 2 + EPS)), 0) / totalWeight
  );
}
```

Além disso:
- **Aumentar K de 10 para 15** — com IDW, mais vizinhos não distorcem o resultado (os distantes têm peso ínfimo), mas aumentam a cobertura quando há poucos dados próximos
- **Retornar `weightedAvg` como `avg`** e calcular `min`/`max` apenas dos K vizinhos selecionados

### Retorno — adicionar campo de confiança (opcional)

Para o frontend saber o quão confiável é a sugestão:

```typescript
// Distância média dos K vizinhos usados — quanto menor, mais próximo da realidade
const avgDistance = candidates.reduce((s, c) => s + c.dist, 0) / candidates.length;
const confidence = avgDistance < 0.3 ? 'high' : avgDistance < 0.6 ? 'medium' : 'low';
```

Possível uso no frontend:
- Alta confiança (distância < 0.3): badge verde "Alta confiança"
- Média (0.3–0.6): badge amarelo "Confiança moderada"
- Baixa (> 0.6): badge vermelho "Poucos dados similares"

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `backend/src/sessions/sessions.service.ts` | Substituir média simples por IDW no método `getPriceSuggestionKnn` |
| `frontend/src/services/price-suggestion.service.ts` | Adicionar campo `confidence` ao tipo `PriceSuggestionResult` (opcional) |
| `frontend/src/app/(dashboard)/budget-suggestion/page.tsx` | Mostrar indicador de confiança (opcional) |

---

## Complexidade

Baixa — mudança concentrada em ~20 linhas no service. Sem mudanças de schema,
sem migrations, sem novos endpoints.

---

## Diferença vs. Modelo Treinado (CatBoost)

| Característica | KNN Ponderado (este plano) | Modelo Treinado |
|---|---|---|
| Implementação | Backend TypeScript, já disponível | Servidor Python separado |
| Treino necessário | Não | Sim (~100–500 amostras) |
| Interpretabilidade | Alta — resultado é média ponderada de casos reais | Baixa — caixa-preta |
| Precisão com 20–50 dados | Boa | Fraca (overfitting) |
| Precisão com 500+ dados | Limitada | Muito superior |
| Custo computacional | Baixo (cálculo em memória) | Alto (inferência de modelo) |

**Conclusão:** KNN ponderado é a abordagem correta agora. O modelo treinado
só faz sentido quando houver volume suficiente de dados reais (estimativa: 200+
sessões por usuário).
