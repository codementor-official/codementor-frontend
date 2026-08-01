import { create } from "zustand";
import { persist } from "zustand/middleware";
import { onboardingSteps } from "@/data/onboarding-steps";
import { EMPTY_LEARNING_PREFERENCE, type LearningPreference } from "@/types/learning-preference";

const TOTAL_STEPS = onboardingSteps.length;

/** Fields stored as string[] in LearningPreference and toggled multi-select. */
const MULTI_FIELDS = new Set<keyof LearningPreference>([
  "interestedFields",
  "interestedTechnologies",
  "preferredLearningStyle",
]);

/** Fields whose option `value` is numeric and must be parsed before storing. */
const NUMERIC_FIELDS = new Set<keyof LearningPreference>(["weeklyStudyHours"]);

interface LearningPreferenceState {
  preference: LearningPreference;
  currentStep: number;
  isModalOpen: boolean;
  hasCompletedOnboarding: boolean;
  hasSkippedOnboarding: boolean;
  /** True once the persisted state has been read from localStorage — gates
   * the auto-open effect so it doesn't race ahead of rehydration and flash
   * the modal open for a user who already completed onboarding. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
  goNext: () => void;
  goBack: () => void;
  toggleMultiValue: (field: keyof LearningPreference, value: string) => void;
  setSingleValue: (field: keyof LearningPreference, value: string) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

export const useLearningPreferenceStore = create<LearningPreferenceState>()(
  persist(
    (set) => ({
      preference: EMPTY_LEARNING_PREFERENCE,
      currentStep: 1,
      isModalOpen: false,
      hasCompletedOnboarding: false,
      hasSkippedOnboarding: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      openModal: () => set({ isModalOpen: true, currentStep: 1 }),
      closeModal: () => set({ isModalOpen: false }),
      goNext: () => set((s) => ({ currentStep: Math.min(TOTAL_STEPS, s.currentStep + 1) })),
      goBack: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),

      toggleMultiValue: (field, value) =>
        set((s) => {
          const current = s.preference[field] as string[];
          const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { preference: { ...s.preference, [field]: next } };
        }),

      setSingleValue: (field, value) =>
        set((s) => ({
          preference: {
            ...s.preference,
            [field]: NUMERIC_FIELDS.has(field) ? Number(value) : value,
          },
        })),

      completeOnboarding: () =>
        set({ isModalOpen: false, hasCompletedOnboarding: true, hasSkippedOnboarding: false }),
      skipOnboarding: () => set({ isModalOpen: false, hasSkippedOnboarding: true }),
    }),
    {
      name: "codementor-learning-preference",
      // isModalOpen/currentStep are ephemeral UI state, not user data — never persist them.
      partialize: (state) => ({
        preference: state.preference,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasSkippedOnboarding: state.hasSkippedOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function isMultiSelectField(field: keyof LearningPreference) {
  return MULTI_FIELDS.has(field);
}
