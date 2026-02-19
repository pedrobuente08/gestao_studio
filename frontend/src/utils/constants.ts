export const TATTOO_SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequena (até 7cm)',
  MEDIUM: 'Média (7–10cm)',
  LARGE: 'Grande (10–15cm)',
  EXTRA_LARGE: 'Extra Grande (15–20cm)',
  XLARGE: 'XL (20–40cm)',
  FULL_BODY: 'Full Body (40cm+)',
};

export const TATTOO_COMPLEXITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  VERY_HIGH: 'Muito Alta',
};

export const BODY_LOCATION_LABELS: Record<string, string> = {
  ARM: 'Braço', FOREARM: 'Antebraço', HAND: 'Mão', FINGER: 'Dedo',
  UPPER_BACK: 'Costas Superior', LOWER_BACK: 'Costas Inferior',
  FULL_BACK: 'Costas Inteiras', CHEST: 'Peito', ABDOMEN: 'Abdômen',
  SHOULDER: 'Ombro', NECK: 'Pescoço', FACE: 'Rosto', HEAD: 'Cabeça',
  THIGH: 'Coxa', CALF: 'Panturrilha', FOOT: 'Pé', RIB: 'Costela',
  INNER_ARM: 'Parte Interna do Braço', WRIST: 'Pulso',
  ANKLE: 'Tornozelo', OTHER: 'Outro',
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  TATTOO: 'Tatuagem', MATERIAL: 'Material', FIXED: 'Fixo',
  MARKETING: 'Marketing', PRO_LABORE: 'Pró-labore',
  INVESTMENT: 'Investimento', OTHER: 'Outros',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: 'PIX', CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito', BOLETO: 'Boleto', CASH: 'Dinheiro',
};
