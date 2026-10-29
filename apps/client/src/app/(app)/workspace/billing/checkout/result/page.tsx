import { Suspense } from "react";
import { CheckoutResultScreen } from "@/features/workspace-billing/checkout-result-screen";


export default function WorkspaceCheckoutResultPage() {
  return (
    <Suspense>
      <CheckoutResultScreen />
    </Suspense>
  );
}
