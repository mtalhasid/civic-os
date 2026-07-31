import { PageShell } from "@/app/_components/global/AppSidebar";
import SmartRouteClient from "@/app/_components/smart-route/SmartRouteClient";

export default function SmartRoutePage() {
  return (
    <PageShell>
      <div className="px-4 py-6 lg:p-10 max-w-full overflow-x-hidden">
        <div className="mb-6 lg:mb-10">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-2">AI Smart Route</h1>
          <p className="text-gray-500 font-medium">
            Describe your route in plain English — we&apos;ll check it against all open civic issues and warn you of anything in your path.
          </p>
        </div>

        <SmartRouteClient />
      </div>
    </PageShell>
  );
}
