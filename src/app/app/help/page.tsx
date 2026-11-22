import { LifeBuoy, Phone, Mail, HelpCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const FAQS = [
  {
    q: 'Does PRAPTI directly submit applications to government portals for me?',
    a: 'No. Government schemes in India are officially processed through their respective state and central portals (e.g. wbkanyashree.gov.in, svmcm.wbhed.gov.in) or physical administrative camps. PRAPTI is an independent discovery and preparation platform. We direct you to the official government portal with verified instructions and document checklists.',
  },
  {
    q: 'Why does PRAPTI never ask for my Aadhaar number or ID card number?',
    a: 'PRAPTI follows strict Privacy by Design principles. To assess whether you may qualify for a scheme and see what documents you need, we only need to know whether you have a document available. Storing sensitive government identity numbers is unnecessary for discovery and creates privacy risks for citizens.',
  },
  {
    q: 'What is the difference between "Likely Eligible" and "Document Readiness"?',
    a: 'Eligibility is whether your life circumstances (such as your age, family income, domicile, or education score) meet the government scheme criteria. Document readiness tracks whether you actually have the required certificates in hand. A citizen can be likely eligible even if they currently lack a certificate.',
  },
  {
    q: 'Can I manage benefits for my family members?',
    a: 'Yes. You can create a Household workspace to invite family members or manage minor dependants. However, adult members retain their own privacy and must explicitly grant you access before their details can be viewed.',
  },
];

const HELPLINES = [
  {
    service: 'Banglar Sahayata Kendra (BSK) Helpline',
    dept: 'Government of West Bengal',
    contact: '1800-345-0117 / 033-2214-0150',
    type: 'Toll Free',
  },
  {
    service: 'Swami Vivekananda Scholarship (SVMCM) Helpdesk',
    dept: 'Higher Education Department, WB',
    contact: '1800-102-8014',
    type: 'Toll Free',
  },
  {
    service: 'Kanyashree Prakalpa Support',
    dept: 'Women & Child Development, WB',
    contact: 'support.kanyashree@wb.gov.in',
    type: 'Email Support',
  },
  {
    service: 'Krishak Bandhu Toll Free Support',
    dept: 'Department of Agriculture, WB',
    contact: '8336957370 / 8336957371',
    type: 'Helpline Numbers',
  },
];

export default function HelpAndSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Frequently asked questions about PRAPTI, citizen data privacy, and official government department helpline contacts."
      />

      <div className="space-y-6">
        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border/60">
              {FAQS.map((faq, i) => (
                <div key={i} className="py-3 text-xs space-y-1">
                  <h3 className="font-semibold text-foreground text-sm">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Official Government Helplines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Official Government Helplines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HELPLINES.map((h, i) => (
                <div key={i} className="rounded-md border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{h.service}</span>
                    <span className="text-[10px] uppercase font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {h.type}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{h.dept}</p>
                  <p className="font-mono font-medium text-foreground text-xs pt-1">{h.contact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

