import { PrismaClient, TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'cmm0q2njo0000lhz5m0mx0ta3';

const data: Array<{
  size: TattooSize;
  bodyLocation: BodyLocation;
  complexity: TattooComplexity;
  price: number; // R$
}> = [
  { size: 'SMALL',       bodyLocation: 'UPPER_BACK', complexity: 'LOW',    price: 450   },
  { size: 'MEDIUM',      bodyLocation: 'UPPER_BACK', complexity: 'LOW',    price: 550   },
  { size: 'EXTRA_LARGE', bodyLocation: 'UPPER_BACK', complexity: 'LOW',    price: 700   },
  { size: 'SMALL',       bodyLocation: 'SHOULDER',   complexity: 'MEDIUM', price: 450   },
  { size: 'MICRO',       bodyLocation: 'INNER_ARM',  complexity: 'LOW',    price: 300   },
  { size: 'SMALL',       bodyLocation: 'COLLARBONE', complexity: 'MEDIUM', price: 350   },
  { size: 'MICRO',       bodyLocation: 'FOREARM',    complexity: 'LOW',    price: 300   },
  { size: 'MEDIUM',      bodyLocation: 'LOWER_BACK', complexity: 'LOW',    price: 450   },
  { size: 'SMALL',       bodyLocation: 'RIB',        complexity: 'HIGH',   price: 450   },
  { size: 'MICRO',       bodyLocation: 'FOREARM',    complexity: 'LOW',    price: 300   },
  { size: 'MICRO',       bodyLocation: 'TRAPEZIUS',  complexity: 'MEDIUM', price: 300   },
  { size: 'SMALL',       bodyLocation: 'ARM',        complexity: 'LOW',    price: 300   },
  { size: 'SMALL',       bodyLocation: 'FOREARM',    complexity: 'HIGH',   price: 350   },
  { size: 'SMALL',       bodyLocation: 'FOREARM',    complexity: 'HIGH',   price: 550   },
  { size: 'SMALL',       bodyLocation: 'RIB',        complexity: 'HIGH',   price: 400   },
  { size: 'SMALL',       bodyLocation: 'INNER_ARM',  complexity: 'MEDIUM', price: 350   },
  { size: 'SMALL',       bodyLocation: 'INNER_ARM',  complexity: 'MEDIUM', price: 400   },
  { size: 'MICRO',       bodyLocation: 'WRIST',      complexity: 'LOW',    price: 300   },
  { size: 'SMALL',       bodyLocation: 'RIB',        complexity: 'MEDIUM', price: 450   },
  { size: 'MEDIUM',      bodyLocation: 'COLLARBONE', complexity: 'HIGH',   price: 650   },
  { size: 'SMALL',       bodyLocation: 'ARM',        complexity: 'HIGH',   price: 700   },
  { size: 'MEDIUM',      bodyLocation: 'FOREARM',    complexity: 'MEDIUM', price: 600   },
  { size: 'EXTRA_LARGE', bodyLocation: 'FOREARM',    complexity: 'HIGH',   price: 800   },
  { size: 'EXTRA_LARGE', bodyLocation: 'ARM',        complexity: 'HIGH',   price: 1200  },
  { size: 'EXTRA_LARGE', bodyLocation: 'ARM',        complexity: 'HIGH',   price: 1800  },
  { size: 'EXTRA_LARGE', bodyLocation: 'ARM',        complexity: 'HIGH',   price: 2200  },
  { size: 'XLARGE',      bodyLocation: 'ARM',        complexity: 'HIGH',   price: 3300  },
];

async function main() {
  const user = await prisma.user.findFirst({
    where: { tenantId: TENANT_ID, role: 'OWNER' },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error(`Nenhum OWNER encontrado para tenantId ${TENANT_ID}`);
  }

  console.log(`✓ Usuário encontrado: ${user.name} (${user.id})`);

  const records = data.map((d) => ({
    tenantId: TENANT_ID,
    userId: user.id,
    size: d.size,
    bodyLocation: d.bodyLocation,
    complexity: d.complexity,
    finalPrice: d.price * 100, // R$ → centavos
  }));

  const result = await prisma.seedTrainingData.createMany({ data: records });

  console.log(`✓ ${result.count} registros inseridos com sucesso.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
