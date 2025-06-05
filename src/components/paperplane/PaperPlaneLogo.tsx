
import type { SVGProps } from 'react';
import { Printer } from 'lucide-react'; // Changed icon to Printer for Vprint

export function PaperPlaneLogo(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 32, className, ...rest } = props;
  return (
    <div className="flex items-center gap-2">
      <Printer size={size} className="text-primary" />
      <span className="text-3xl font-headline font-semibold text-primary">Vprint</span>
    </div>
  );
}
