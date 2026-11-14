import { getProviders } from "@/actions/slots";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const providers = await getProviders();

  return <BookingWizard providers={providers} />;
}
