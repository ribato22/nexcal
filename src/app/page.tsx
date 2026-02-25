import { getActiveServices } from "@/actions/slots";
import { BookingWizard } from "@/components/booking/booking-wizard";

export default async function BookingPage() {
  const services = await getActiveServices();

  return <BookingWizard services={services} />;
}
