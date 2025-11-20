// Shared utilities for unit typology and floor

export const typologyOptions = [
  { value: "estudio", labelEs: "Estudio", labelEn: "Studio" },
  { value: "estudio_plus", labelEs: "Estudio Plus", labelEn: "Studio Plus" },
  { value: "1_recamara", labelEs: "1 Recámara", labelEn: "1 Bedroom" },
  { value: "2_recamaras", labelEs: "2 Recámaras", labelEn: "2 Bedrooms" },
  { value: "3_recamaras", labelEs: "3 Recámaras", labelEn: "3 Bedrooms" },
  { value: "loft_mini", labelEs: "Loft Mini", labelEn: "Mini Loft" },
  { value: "loft_normal", labelEs: "Loft Normal", labelEn: "Normal Loft" },
  { value: "loft_plus", labelEs: "Loft Plus", labelEn: "Loft Plus" },
] as const;

export const floorOptions = [
  { value: "planta_baja", labelEs: "Planta Baja", labelEn: "Ground Floor" },
  { value: "primer_piso", labelEs: "Primer Piso", labelEn: "First Floor" },
  { value: "segundo_piso", labelEs: "Segundo Piso", labelEn: "Second Floor" },
  { value: "tercer_piso", labelEs: "Tercer Piso", labelEn: "Third Floor" },
  { value: "penthouse", labelEs: "Penthouse", labelEn: "Penthouse" },
] as const;

export const formatTypology = (typology: string | null | undefined, language: string): string => {
  if (!typology) return '-';
  const option = typologyOptions.find(opt => opt.value === typology);
  return option ? (language === "es" ? option.labelEs : option.labelEn) : typology;
};

export const formatFloor = (floor: string | null | undefined, language: string): string => {
  if (!floor) return '-';
  const option = floorOptions.find(opt => opt.value === floor);
  return option ? (language === "es" ? option.labelEs : option.labelEn) : floor;
};
