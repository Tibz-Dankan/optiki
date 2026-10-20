import { Separator } from '@shared/ui/separator'

type ContentSectionProps = {
  title: string
  desc: string
  children: React.ReactNode
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  desc,
  children,
}) => {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-none'>
        <h2 className='text-lg font-medium'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        <div className='-mx-1 px-1.5 lg:max-w-3xl'>{children}</div>
      </div>
    </div>
  )
}
