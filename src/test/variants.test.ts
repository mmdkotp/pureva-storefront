import { describe, expect, it } from 'vitest';
import { catalogMatches, catalogSummary, fragranceOptions, selectFragranceVariant } from '@/lib/variants';
const variants = [
  {id:'lemon-500',size_label:'500 مل',fragrance:'ليمون',price:50,stock:8,active:true},
  {id:'lemon-1l',size_label:'1 لتر',fragrance:'ليمون',price:90,stock:3,active:true},
  {id:'mint-1l',size_label:'1 لتر',fragrance:'نعناع',price:100,stock:5,active:true},
  {id:'hidden',size_label:'2 لتر',fragrance:'تفاح',price:20,stock:5,active:false},
];
describe('expandable catalog',()=>{
  it('lists fragrances without repeating them for each size',()=>expect(fragranceOptions(variants)).toEqual(['ليمون','نعناع']));
  it('keeps the size when selecting a different fragrance',()=>expect(selectFragranceVariant(variants,'نعناع','1 لتر')?.id).toBe('mint-1l'));
  it('falls back only within the selected fragrance',()=>expect(selectFragranceVariant(variants,'نعناع','500 مل')?.id).toBe('mint-1l'));
  it('never selects an inactive variant',()=>expect(selectFragranceVariant(variants,'تفاح')).toBeUndefined());
  it('uses the cheapest active variant as starting price',()=>expect(catalogSummary(variants).startingPrice).toBe(50));
  it('marks sold-out variants unavailable',()=>expect(catalogSummary(variants.map(v=>({...v,stock:0}))).available).toBe(false));
  const p={name_ar:'كلين توب',name_en:'KLEANTOP',category_id:'dish',product_variants:variants};
  it('searches fragrance and category together',()=>expect(catalogMatches(p,'مواعين نعناع','سائل مواعين')).toBe(true));
  it('does not search inactive fragrances',()=>expect(catalogMatches(p,'تفاح','سائل مواعين')).toBe(false));
  it('rejects unrelated category searches',()=>expect(catalogMatches(p,'زجاج','سائل مواعين')).toBe(false));
});