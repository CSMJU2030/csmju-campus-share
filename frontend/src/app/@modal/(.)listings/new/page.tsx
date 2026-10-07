import { ListingCreateDialog } from "@/components/features/ListingCreateDialog";
import { Gate } from "@/components/shared/Providers";

export default function InterceptedListingCreatePage() {
  return (
    <Gate permission="listing:create">
      <ListingCreateDialog />
    </Gate>
  );
}
