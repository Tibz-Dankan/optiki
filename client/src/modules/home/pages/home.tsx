import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRight,
  Eye,
  GitPullRequest,
  Loader2,
  ScanSearch,
} from 'lucide-react'
import type { TScanReportResponse } from '@typings/scan'
import { scanAPI } from '@api/scan'
import { Button } from '@shared/ui/button'
import { HomeLayout } from '@modules/home/layout/home-layout'

const highlights = [
  {
    icon: Eye,
    title: 'See what agents see',
    desc: 'Audit the accessibility tree that AI agents and screen readers actually read.',
  },
  {
    icon: ScanSearch,
    title: 'Rules from real failures',
    desc: 'Every check comes from a failure logged in a real AI test run, with the exact fix.',
  },
  {
    icon: GitPullRequest,
    title: 'Gate every pull request',
    desc: 'Scan each pull request with an API token and catch changes that make your app harder to use.',
  },
]

export const Home: React.FC = () => {
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: scanAPI.create,
    onSuccess: (response: TScanReportResponse) => {
      navigate(`/scans/${response.data.id}`)
    },
  })

  return (
    <HomeLayout>
      <section className='mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center md:py-28'>
        <h1 className='text-4xl font-bold tracking-tight text-balance md:text-5xl'>
          See your app the way an AI agent does
        </h1>
        <p className='mt-4 max-w-2xl text-lg text-balance text-muted-foreground'>
          optikí scans your pages for the problems that make AI agents and
          screen readers fail, shows the exact fix, and runs on every pull
          request.
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button
            size='lg'
            type='button'
            disabled={isPending}
            onClick={() => mutate({ gym: 'kitchen-sink' })}
          >
            Try a demo scan
            {isPending ? <Loader2 className='animate-spin' /> : <ArrowRight />}
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link to='/scan'>Scan your page</Link>
          </Button>
        </div>
      </section>

      <section
        aria-label='Highlights'
        className='mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3'
      >
        {highlights.map((highlight) => (
          <div
            key={highlight.title}
            className='rounded-lg border border-border bg-card p-6'
          >
            <highlight.icon className='size-6 text-primary' aria-hidden />
            <h2 className='mt-4 font-semibold'>{highlight.title}</h2>
            <p className='mt-2 text-sm text-muted-foreground'>
              {highlight.desc}
            </p>
          </div>
        ))}
      </section>
    </HomeLayout>
  )
}
