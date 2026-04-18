/**
 * OpenFDA API Client
 * Base URL: https://api.fda.gov/drug
 */

const BASE_URL = 'https://api.fda.gov/drug';

export interface InteractionResult {
  severity: 'contraindicated' | 'major' | 'minor';
  description: string;
  source: 'openfda';
}

/**
 * Checks for interactions of a drug using OpenFDA label search.
 * This searches the 'drug_interactions' section of the drug label.
 */
export async function checkOpenFdaInteractions(
  genericName: string,
  existingMeds: string[]
): Promise<InteractionResult[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/label.json?search=drug_interactions:${encodeURIComponent(genericName)}&limit=1`
    );
    
    if (!response.ok) {
      if (response.status === 404) return []; // No label found
      throw new Error('OpenFDA API request failed');
    }

    const data = await response.json();
    const interactionsText = data.results?.[0]?.drug_interactions?.[0];

    if (!interactionsText) return [];

    const alerts: InteractionResult[] = [];
    const lowerText = interactionsText.toLowerCase();

    // Check if any existing medication is mentioned in the interaction text
    for (const otherMed of existingMeds) {
      if (lowerText.includes(otherMed.toLowerCase())) {
        // Basic heuristic for severity mapping
        let severity: 'contraindicated' | 'major' | 'minor' = 'minor';
        if (lowerText.includes('fatal') || lowerText.includes('death') || lowerText.includes('do not use')) {
          severity = 'contraindicated';
        } else if (lowerText.includes('serious') || lowerText.includes('severe') || lowerText.includes('warning')) {
          severity = 'major';
        }

        alerts.push({
          severity,
          description: `Interaction found for ${genericName} with ${otherMed}: ${interactionsText.substring(0, 200)}...`,
          source: 'openfda',
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error in OpenFDA interaction check:', error);
    return [];
  }
}
