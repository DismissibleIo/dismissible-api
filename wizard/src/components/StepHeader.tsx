interface StepHeaderProps {
  title: string;
  description: string;
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-white/70 mb-8">{description}</p>
    </>
  );
}
