import assert from "node:assert/strict";
import {
  fromAccountPreferences,
  toAccountPreferences,
} from "./learning-preference-mapper";
import { EMPTY_LEARNING_PREFERENCE } from "@/types/learning-preference";

// Same self-check convention as src/lib/video-progress.test.ts.
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { localStorage },
});
async function run() {
  const { useLearningPreferenceStore } =
    await import("@/lib/store/learning-preference-store");
  const state = useLearningPreferenceStore.getState;
  const preference = {
    ...EMPTY_LEARNING_PREFERENCE,
    learningGoal: "Học để đi làm",
    careerGoal: "Web Developer",
    currentLevel: "basic" as const,
    contentPriority: "practice" as const,
    weeklyStudyHours: 8,
    interestedFields: ["data-ai", "backend"],
    interestedTechnologies: ["TypeScript", "SQL"],
    preferredLearningStyle: ["hands-on", "article"],
  };

  // Editing a GET response must not send its read-only timestamp back to PATCH.
  for (const completedAt of [null, "2026-09-02T08:00:00.000Z"]) {
    const response = { ...toAccountPreferences(preference), completedAt };
    const patch = toAccountPreferences(fromAccountPreferences(response));
    assert.equal(Object.hasOwn(patch, "completedAt"), false);
    assert.deepEqual(patch, toAccountPreferences(preference));
    assert.equal(patch.schedule.length, 7);
    assert.deepEqual(patch.interestedFields, ["data-ai", "backend"]);
  }

  state().setUser("learner-a");
  state().hydratePreferenceFromServer(preference, false);
  state().openModal();
  assert.equal(state().hasCompletedOnboarding, false);

  const pendingRequestRevision = state().preferenceRevision;
  state().savePreferenceSettings(preference);
  assert.equal(
    state().isModalOpen,
    false,
    "settings save closes an already-open survey",
  );
  assert.equal(state().hasCompletedOnboarding, true);
  assert.equal(state().hasSkippedOnboarding, false);
  assert.notEqual(
    state().preferenceRevision,
    pendingRequestRevision,
    "late GET cannot overwrite a save",
  );

  // Rehydrating the same account preserves completion; another account starts clean.
  state().setUser("learner-a");
  assert.equal(state().hasCompletedOnboarding, true);
  state().setUser("learner-b");
  assert.equal(state().hasCompletedOnboarding, false);
  assert.equal(state().isModalOpen, false);
  assert.deepEqual(state().preference, EMPTY_LEARNING_PREFERENCE);

  state().openModal();
  state().hydratePreferenceFromServer(preference, true);
  assert.equal(
    state().isModalOpen,
    false,
    "server completion also closes the survey",
  );
  assert.equal(state().hasCompletedOnboarding, true);

  state().setUser(null);
  assert.equal(state().hasCompletedOnboarding, false);
  state().setUser("learner-a");
  state().hydratePreferenceFromServer(preference, true);
  assert.equal(
    state().hasCompletedOnboarding,
    true,
    "login restores database completion",
  );

  state().setUser("new-learner");
  state().skipOnboarding();
  state().hydratePreferenceFromServer(EMPTY_LEARNING_PREFERENCE, false);
  assert.equal(
    state().hasSkippedOnboarding,
    true,
    "a GET must not undo skipping for the same account",
  );
  assert.equal(
    state().hasCompletedOnboarding,
    false,
    "skipping is not successful persistence",
  );
  state().setUser("different-learner");
  assert.equal(state().hasSkippedOnboarding, false);

  console.log(
    "Personalization payload and account-scoped onboarding checks passed.",
  );
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
}
void run();
