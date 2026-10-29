import { Suspense } from "react";
import { CheckoutScreen } from "@/features/workspace-billing/checkout-screen";


/** `useSearchParams` needs a Suspense boundary to prerender. */
export default function WorkspaceCheckoutPage() {
  return (
    <Suspense>
      <CheckoutScreen />
    </Suspense>
  );
}
