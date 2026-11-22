import { BookOpen, FileCheck, Landmark, MapPin, Sparkles, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const GUIDES = [
  {
    icon: Landmark,
    title: 'How to Obtain a Domicile or Residential Certificate in West Bengal',
    description:
      'Required for scholarships like SVMCM and state-specific benefits.',
    steps: [
      'Apply online through the e-District West Bengal portal (edistrict.wb.gov.in) or visit your local BDO / SDO office.',
      'Required documents: Proof of citizenship (Voter ID/Passport), birth proof, residential proof (electricity bill, land tax receipt), and two passport photos.',
      'Certificates are typically issued by the SDO or BDO within 7 to 15 working days.',
    ],
  },
  {
    icon: FileCheck,
    title: 'How to Obtain an Income Certificate from SDO / BDO',
    description:
      'Required for merit-cum-means assistance, low-income household schemes, and fee concessions.',
    steps: [
      'Apply via the e-District portal or your Gram Panchayat / Municipality office first to obtain an initial income report.',
      'Submit employer pay slip, IT return, or local Gram Panchayat Pradhan / Councillor certificate as primary income evidence.',
      'The BDO / SDO issues the official signed digital Income Certificate valid for the ongoing financial year.',
    ],
  },
  {
    icon: Building2,
    title: 'Linking Bank Account with Aadhaar for DBT (Direct Benefit Transfer)',
    description:
      'Crucial for receiving funds for Lakshmir Bhandar, Krishak Bandhu, Kanyashree, and PM-KISAN directly into your account.',
    steps: [
      'Visit your bank branch with your passbook and Aadhaar card.',
      'Fill in the standard Aadhaar-seeding / NPCI mapping consent form.',
      'Ensure the bank enables "DBT / NPCI active flag" on your primary savings account.',
      'Verify status on the UIDAI portal under "Check Aadhaar & Bank Account Linking Status".',
    ],
  },
  {
    icon: MapPin,
    title: 'Duare Sarkar Camp Guide: What to Prepare',
    description:
      'Outreach camps conducted across West Bengal for on-spot scheme registration.',
    steps: [
      'Locate your nearest camp schedule at your local Gram Panchayat or Municipality notice board or dswb.gov.in.',
      'Carry self-attested photocopies of Voter ID, Aadhaar availability proof, single bank passbook, and passport photos.',
      'Obtain numbered official scheme forms directly from camp counters (forms are distributed free of cost).',
      'Collect and retain your stamped acknowledgement receipt with registration serial number.',
    ],
  },
];

export default function ApplicationGuidesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Guides"
        description="Clear, step-by-step guidance on how to obtain standard Indian government certificates, prepare documents, and navigate official state procedures."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{guide.title}</CardTitle>
                </div>
                <CardDescription className="text-xs mt-1.5 leading-relaxed">
                  {guide.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-4 text-xs text-muted-foreground leading-relaxed">
                  {guide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

