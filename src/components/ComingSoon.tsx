interface ComingSoonProps {
  feature: string;
}

export function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-medium text-foreground">{feature}</h2>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
