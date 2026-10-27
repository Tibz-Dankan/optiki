export const HeroBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 [--glow:color-mix(in_oklab,var(--primary)_12%,transparent)] [--grid:color-mix(in_oklab,var(--foreground)_5%,transparent)] dark:[--glow:color-mix(in_oklab,var(--primary)_16%,transparent)]'
    >
      <div className='absolute inset-0 bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_80%_at_20%_0%,black_20%,transparent_70%)] bg-size-[56px_56px]' />
      <div className='absolute -top-80 -left-50 h-160 w-225 bg-[radial-gradient(closest-side,var(--glow),transparent)]' />
    </div>
  )
}
