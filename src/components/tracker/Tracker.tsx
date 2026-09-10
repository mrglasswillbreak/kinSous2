import { Suspense } from "react";
import OrderExperience from "@/components/payment/OrderExperience";
export default function Tracker() {
  return (
    <Suspense fallback={<p className="p-6">Loading delivery?</p>}>
      <OrderExperience />
    </Suspense>
  );
}
