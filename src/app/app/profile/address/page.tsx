import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getAddresses } from '../actions';
import { AddressForm } from './address-form';

export default async function AddressPage() {
  const addresses = await getAddresses();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Address"
        description="Your current and permanent addresses are kept separately, because some schemes ask for domicile rather than current residence."
      />

      <Card>
        <CardHeader>
          <CardTitle>Current address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm kind="current" initial={addresses.current} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Permanent address</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressForm kind="permanent" initial={addresses.permanent} />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          Leave this empty if it is the same as your current address.
        </p>
      </div>
    </div>
  );
}
