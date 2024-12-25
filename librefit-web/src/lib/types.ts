import type { WizardOptions } from "./enum"

export interface RadioInputChoice {
  value: string,
  label: string
}

export interface WizardTargetSelection {
  customDetails: string | undefined,
  userChoice: WizardOptions
}
