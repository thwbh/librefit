/** types.ts contains types exclusive to the UI */

import type { WizardOptions } from './enum';

export interface WizardTargetSelection {
  customDetails: unknown;
  userChoice: WizardOptions;
}


