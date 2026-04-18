/**
 * RxNorm API Client
 * Base URL: https://rxnav.nlm.nih.gov/REST
 */

const BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

export interface RxNormResult {
  rxcui: string;
  name: string;
  synonym: string;
}

/**
 * Normalizes a drug name to get its RxCUI and generic name.
 * Uses: GET /drugs.json?name={drugName}
 */
export async function normalizeDrug(drugName: string): Promise<RxNormResult | null> {
  try {
    const response = await fetch(`${BASE_URL}/drugs.json?name=${encodeURIComponent(drugName)}`);
    if (!response.ok) throw new Error('RxNorm API request failed');
    
    const data = await response.json();
    
    // The response structure is .drugGroup.conceptGroup[].conceptProperties[]
    const conceptGroup = data.drugGroup?.conceptGroup;
    if (!conceptGroup) return null;

    // Find the first concept with an RxCUI
    for (const group of conceptGroup) {
      if (group.conceptProperties && group.conceptProperties.length > 0) {
        const prop = group.conceptProperties[0];
        return {
          rxcui: prop.rxcui,
          name: prop.name,
          synonym: prop.synonym || '',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error in RxNorm normalization:', error);
    return null;
  }
}

/**
 * Gets names associated with an RxCUI.
 * Uses: GET /rxcui/{rxcui}/allProperties.json?prop=names
 */
export async function getDrugProperties(rxcui: string) {
  try {
    const response = await fetch(`${BASE_URL}/rxcui/${rxcui}/allProperties.json?prop=names`);
    if (!response.ok) throw new Error('RxNorm API request failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching RxNorm properties:', error);
    return null;
  }
}
