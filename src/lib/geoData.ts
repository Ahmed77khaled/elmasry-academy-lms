/**
 * Geographic Data for Academy Trainees
 * Features: Egypt (default) with all 27 governorates sorted alphabetically,
 * plus major Arab and international countries with custom text fallback.
 */

export interface CountryOption {
  code: string;
  name: string;
  defaultGovernorates?: string[];
}

export const EGYPT_GOVERNORATES = [
  'الإسكندرية',
  'الإسماعيلية',
  'أسوان',
  'أسيوط',
  'الأقصر',
  'البحر الأحمر',
  'البحيرة',
  'بني سويف',
  'بورسعيد',
  'جنوب سيناء',
  'الجيزة',
  'الدقهلية',
  'دمياط',
  'سوهاج',
  'السويس',
  'الشرقية',
  'شمال سيناء',
  'الغربية',
  'الفيوم',
  'القاهرة',
  'القليوبية',
  'قنا',
  'كفر الشيخ',
  'مطروح',
  'المنوفية',
  'المنيا',
  'الوادي الجديد',
] as const;

export const COUNTRIES: CountryOption[] = [
  { code: 'EG', name: 'مصر', defaultGovernorates: [...EGYPT_GOVERNORATES] },
  { code: 'SA', name: 'المملكة العربية السعودية', defaultGovernorates: ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'القصيم', 'المنطقة الشرقية', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'] },
  { code: 'AE', name: 'الإمارات العربية المتحدة', defaultGovernorates: ['أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة'] },
  { code: 'KW', name: 'الكويت', defaultGovernorates: ['العاصمة', 'حولي', 'الأحمدي', 'الجهراء', 'الفروانية', 'مبارك الكبير'] },
  { code: 'QA', name: 'قطر', defaultGovernorates: ['الدوحة', 'الريان', 'الوكرة', 'الخور', 'الشمال', 'أم صلال', 'الظعاين'] },
  { code: 'BH', name: 'البحرين', defaultGovernorates: ['المنامة', 'المحرق', 'الشمالية', 'الجنوبية'] },
  { code: 'OM', name: 'سلطنة عمان', defaultGovernorates: ['مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية', 'شمال الباطنة', 'جنوب الباطنة', 'جنوب الشرقية', 'شمال الشرقية', 'الظاهرة', 'الوسطى'] },
  { code: 'JO', name: 'الأردن', defaultGovernorates: ['عمان', 'إربد', 'الزرقاء', 'البلقاء', 'العقبة', 'المفرق', 'جرش', 'مأدبا', 'عجلون', 'الكرك', 'الطفيلة', 'معان'] },
  { code: 'IQ', name: 'العراق', defaultGovernorates: ['بغداد', 'البصرة', 'أربيل', 'النجف', 'كربلاء', 'الموصل', 'السليمانية', 'كركوك'] },
  { code: 'LY', name: 'ليبيا', defaultGovernorates: ['طرابلس', 'بنغازي', 'مصراتة', 'البيضاء', 'طبرق', 'سبها', 'الزاوية'] },
  { code: 'SD', name: 'السودان', defaultGovernorates: ['الخرطوم', 'أم درمان', 'بورتسودان', 'كسلا', 'نيالا'] },
  { code: 'OTHER', name: 'دولة أخرى' },
];

export function getGovernoratesForCountry(countryName: string): string[] {
  const normalized = countryName.trim();
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === normalized.toLowerCase() || (c.code === 'EG' && (!normalized || normalized === 'مصر' || normalized === 'Egypt'))
  );
  return found?.defaultGovernorates ?? [];
}
