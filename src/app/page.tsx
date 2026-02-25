import { getProviders } from "@/actions/slots";
import { BookingWizard } from "@/components/booking/booking-wizard";

export default async function BookingPage() {
  const providers = await getProviders();

  return <BookingWizard providers={providers} />;
}
