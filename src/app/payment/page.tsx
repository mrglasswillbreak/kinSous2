import { Suspense } from "react";
import OrderExperience from "@/components/payment/OrderExperience";
export default function PaymentPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading orders?</p>}>
      <OrderExperience />
    </Suspense>
  );
}
