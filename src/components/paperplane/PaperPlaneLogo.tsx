import type { SVGProps } from 'react';
import {Send} from 'lucide-react';

export function PaperPlaneLogo(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 32, className, ...rest } = props;
  return (
    <div className="flex items-center gap-2">
      <Send size={size} className="text-primary" />
      <span className="text-2xl font-headline font-semibold text-primary">PaperPlane</span>
    </div>
  );
}
