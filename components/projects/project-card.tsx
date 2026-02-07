import Link from "next/link";
import { Card } from "@/components/ui/card";

type ProjectCardProps = {
  name: string;
  status: string;
  tokenCount: number;
  lastSynced: string;
  href?: string;
};

export function ProjectCard({
  name,
  status,
  tokenCount,
  lastSynced,
  href,
}: ProjectCardProps) {
  const content = (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-foreground-tertiary">Repository</p>
        <p className="text-lg font-semibold">{name}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-foreground-tertiary">Tokens</p>
          <p className="font-medium text-foreground">{tokenCount}</p>
        </div>
        <div>
          <p className="text-foreground-tertiary">Status</p>
          <p className="font-medium text-foreground">{status}</p>
        </div>
      </div>
      <p className="text-xs text-foreground-tertiary">Last synced {lastSynced}</p>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
