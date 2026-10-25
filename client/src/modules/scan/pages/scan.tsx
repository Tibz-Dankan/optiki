import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scanErrorMessages } from '@constants/scan'
import type { TCreateScanInput, TScanReportResponse } from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { useAuthStore } from '@stores/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { GymExamples } from '@modules/scan/ui/gym-examples'
import { HtmlScanForm } from '@modules/scan/ui/html-scan-form'
import { UrlScanForm } from '@modules/scan/ui/url-scan-form'

export const Scan: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isVerified = useAuthStore(
    (state) => !!state.auth.session.userID && state.auth.user.emailVerified
  )

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (input: TCreateScanInput) => scanAPI.create(input),
    onSuccess: (response: TScanReportResponse) => {
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
      navigate(`/scans/${response.data.id}`)
    },
    onError: () => {},
  })

  const scan = (input: TCreateScanInput) => {
    reset()
    mutate(input)
  }

  const errorMessage =
    error &&
    ((isHttpError(error) && scanErrorMessages[error.error]) || error.message)

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-12'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Scan a page</h1>
          <p className='mt-2 text-muted-foreground'>
            {isVerified
              ? 'Your scans run all 17 rules and are saved privately to your history.'
              : 'Signed out, scans run the 9 core rules. Anyone with the link can open the report.'}
          </p>
        </div>

        {errorMessage && (
          <p
            role='alert'
            className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
          >
            {errorMessage}
          </p>
        )}

        <Tabs defaultValue='gym'>
          <TabsList>
            <TabsTrigger value='gym'>Gym example</TabsTrigger>
            <TabsTrigger value='url'>URL</TabsTrigger>
            <TabsTrigger value='html'>Paste HTML</TabsTrigger>
          </TabsList>
          <TabsContent value='gym' className='pt-4'>
            <GymExamples
              isPending={isPending}
              onScan={(gym) => scan({ gym })}
            />
          </TabsContent>
          <TabsContent value='url' className='pt-4'>
            <UrlScanForm
              isPending={isPending}
              canRender={isVerified}
              onScan={(url) => scan({ url })}
            />
          </TabsContent>
          <TabsContent value='html' className='pt-4'>
            <HtmlScanForm
              isPending={isPending}
              onScan={(html) => scan({ html })}
            />
          </TabsContent>
        </Tabs>

        {isPending && (
          <p role='status' className='text-sm text-muted-foreground'>
            Scanning… rendered scans take a few seconds.
          </p>
        )}
      </div>
    </HomeLayout>
  )
}
