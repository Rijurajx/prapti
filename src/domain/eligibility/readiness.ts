import type {
  CitizenDocumentStatus,
  DocumentReadinessItem,
  DocumentReadinessResult,
  SchemeDocumentRequirement,
} from './types';

/**
 * Compares the required documents of a scheme against the citizen's document inventory.
 * Strictly separates document possession from eligibility assessment.
 */
export function evaluateDocumentReadiness(
  requirements: SchemeDocumentRequirement[],
  inventory: CitizenDocumentStatus[],
): DocumentReadinessResult {
  const inventoryByCode = new Map<string, CitizenDocumentStatus>();
  for (const item of inventory) {
    inventoryByCode.set(item.documentCode, item);
  }

  const items: DocumentReadinessItem[] = requirements.map((req) => {
    const existing = inventoryByCode.get(req.documentCode);
    const status = existing?.status ?? 'not_available';

    const isReady = status === 'available';
    const isMissing = status === 'not_available';
    const isInProgress = status === 'applied_for';
    const isUnsure = status === 'unsure' || status === 'expired';

    return {
      requirement: req,
      citizenStatus: status,
      isReady,
      isMissing,
      isInProgress,
      isUnsure,
    };
  });

  const mandatoryItems = items.filter((i) => i.requirement.isMandatory);
  const mandatoryTotal = mandatoryItems.length;
  const mandatoryReady = mandatoryItems.filter((i) => i.isReady).length;

  const missingMandatoryDocuments = mandatoryItems.filter((i) => i.isMissing);
  const inProgressDocuments = items.filter((i) => i.isInProgress || i.isUnsure);

  const isFullyReady = mandatoryTotal > 0 ? mandatoryReady === mandatoryTotal : true;

  return {
    isFullyReady,
    mandatoryTotal,
    mandatoryReady,
    items,
    missingMandatoryDocuments,
    inProgressDocuments,
  };
}

