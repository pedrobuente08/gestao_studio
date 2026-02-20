import { PrismaClient, TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed das tabelas de escala...');

  // ─── Escala de Tamanho ────────────────────────────────────────────────────
  const sizeScaleData: { size: TattooSize; level: number }[] = [
    { size: TattooSize.SMALL,       level: 1 }, // Pequena (7-10 cm)
    { size: TattooSize.MEDIUM,      level: 2 }, // Média (10-15 cm)
    { size: TattooSize.LARGE,       level: 3 }, // Grande (15-20 cm)
    { size: TattooSize.EXTRA_LARGE, level: 4 }, // XL (20-30 cm)
    { size: TattooSize.XLARGE,      level: 5 }, // XXL (30+ cm)
    { size: TattooSize.FULL_BODY,   level: 5 }, // Legado — mesmo nível que XXL
  ];

  for (const data of sizeScaleData) {
    await prisma.tattooSizeScale.upsert({
      where: { size: data.size },
      update: { level: data.level },
      create: data,
    });
  }
  console.log('✅ TattooSizeScale populado');

  // ─── Escala de Complexidade ───────────────────────────────────────────────
  const complexityScaleData: { complexity: TattooComplexity; level: number }[] = [
    { complexity: TattooComplexity.LOW,       level: 1 }, // Baixa
    { complexity: TattooComplexity.MEDIUM,    level: 2 }, // Média
    { complexity: TattooComplexity.HIGH,      level: 3 }, // Alta
    { complexity: TattooComplexity.VERY_HIGH, level: 4 }, // Muito Alta
  ];

  for (const data of complexityScaleData) {
    await prisma.tattooComplexityScale.upsert({
      where: { complexity: data.complexity },
      update: { level: data.level },
      create: data,
    });
  }
  console.log('✅ TattooComplexityScale populado');

  // ─── Escala de Local do Corpo ─────────────────────────────────────────────
  const bodyLocationScaleData: { bodyLocation: BodyLocation; level: number }[] = [
    // Nível 1 — Áreas mais acessíveis
    { bodyLocation: BodyLocation.FOREARM,   level: 1 }, // Antebraço
    { bodyLocation: BodyLocation.UPPER_BACK, level: 1 }, // Costas superior
    { bodyLocation: BodyLocation.THIGH,     level: 1 }, // Coxa
    { bodyLocation: BodyLocation.INNER_ARM, level: 1 }, // Braço parte interna
    { bodyLocation: BodyLocation.WRIST,     level: 1 }, // Pulso
    { bodyLocation: BodyLocation.ARM,       level: 1 }, // Braço parte externa
    // Nível 2 — Áreas moderadas
    { bodyLocation: BodyLocation.LOWER_BACK, level: 2 }, // Costas inferior
    { bodyLocation: BodyLocation.CHEST,     level: 2 }, // Peito
    { bodyLocation: BodyLocation.ABDOMEN,   level: 2 }, // Abdomen
    { bodyLocation: BodyLocation.CALF,      level: 2 }, // Panturilha
    { bodyLocation: BodyLocation.ANKLE,     level: 2 }, // Tornozelo
    { bodyLocation: BodyLocation.TRAPEZIUS, level: 2 }, // Trapézio
    { bodyLocation: BodyLocation.SHIN,      level: 2 }, // Canela
    // Nível 3 — Áreas mais difíceis / sensíveis
    { bodyLocation: BodyLocation.HAND,      level: 3 }, // Mão
    { bodyLocation: BodyLocation.FINGER,    level: 3 }, // Dedo
    { bodyLocation: BodyLocation.SHOULDER,  level: 3 }, // Ombro
    { bodyLocation: BodyLocation.NECK,      level: 3 }, // Pescoço
    { bodyLocation: BodyLocation.FACE,      level: 3 }, // Rosto
    { bodyLocation: BodyLocation.HEAD,      level: 3 }, // Cabeça
    { bodyLocation: BodyLocation.FOOT,      level: 3 }, // Pé
    { bodyLocation: BodyLocation.RIB,       level: 3 }, // Costela
    { bodyLocation: BodyLocation.COLLARBONE, level: 3 }, // Clavícula
    // Legado
    { bodyLocation: BodyLocation.FULL_BACK, level: 2 }, // Costas inteiras (legado)
    { bodyLocation: BodyLocation.OTHER,     level: 1 }, // Outro (legado)
  ];

  for (const data of bodyLocationScaleData) {
    await prisma.bodyLocationScale.upsert({
      where: { bodyLocation: data.bodyLocation },
      update: { level: data.level },
      create: data,
    });
  }
  console.log('✅ BodyLocationScale populado');

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
