import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { generatedViaLabels } from '@constants/session'
import type { TActiveSession } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { formatDateTime } from '@utils/format-date-time'
import { getBrowserLabel } from '@utils/get-browser-label'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { RevokeSessionDialog } from '@modules/settings/ui/revoke-session-dialog'

const SESSION_PAGE_SIZE = 25

export const ActiveSessionsSection: React.FC = () => {
  const [sessionToRevoke, setSessionToRevoke] = useState<TActiveSession | null>(
    null
  )

  const {
    data,
    isPending,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: authKeys.sessions(),
    queryFn: ({ pageParam }) =>
      authAPI.getActiveSessions(SESSION_PAGE_SIZE, pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextItems
        ? lastPage.pagination.nextCursor
        : undefined,
  })

  const sessions = data?.pages.flatMap((page) => page.data) ?? []

  if (isPending) {
    return (
      <section className='mt-10'>
        <h3 className='text-sm font-semibold text-muted-foreground'>
          Active sessions
        </h3>
        <div className='mt-4 flex w-full flex-col gap-4'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-10 w-full' />
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className='mt-10'>
        <h3 className='text-sm font-semibold text-muted-foreground'>
          Active sessions
        </h3>
        <p role='alert' className='mt-4 text-sm text-destructive'>
          {error.message}
        </p>
      </section>
    )
  }

  return (
    <section className='mt-10'>
      <h3 className='text-sm font-semibold text-muted-foreground'>
        Active sessions
      </h3>

      <div className='mt-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Browser</TableHead>
              <TableHead>IP address</TableHead>
              <TableHead>Signed in via</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead className='text-right'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    {getBrowserLabel(session.userAgent)}
                    {session.isCurrentSession && <Badge>Current</Badge>}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {session.ip || 'Unknown'}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {generatedViaLabels[session.generatedVia]}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatDateTime(session.createdAt)}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatDateTime(session.lastUsedAt)}
                </TableCell>
                <TableCell className='text-right'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setSessionToRevoke(session)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            No active sessions.
          </p>
        )}

        {hasNextPage && (
          <div className='mt-4 flex justify-center'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load more
              {isFetchingNextPage && <Loader2 className='animate-spin' />}
            </Button>
          </div>
        )}
      </div>

      <RevokeSessionDialog
        session={sessionToRevoke}
        onOpenChange={(isOpen) => !isOpen && setSessionToRevoke(null)}
      />
    </section>
  )
}
