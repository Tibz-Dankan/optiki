import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { KeyRound, Loader2 } from 'lucide-react'
import {
  apiTokenPageSize,
  apiTokenPermissionLabels,
} from '@constants/api-token'
import type { TAPIToken, TCreatedAPIToken } from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
import { formatDateTime } from '@utils/format-date-time'
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
import { APITokenActions } from '@modules/api-token/ui/api-token-actions'
import { APITokenCreatedDialog } from '@modules/api-token/ui/api-token-created-dialog'
import { APITokenStatusBadge } from '@modules/api-token/ui/api-token-status-badge'
import { CreateAPITokenDialog } from '@modules/api-token/ui/create-api-token-dialog'
import { DeleteAPITokenDialog } from '@modules/api-token/ui/delete-api-token-dialog'
import { EditAPITokenDialog } from '@modules/api-token/ui/edit-api-token-dialog'
import { RevokeAPITokenDialog } from '@modules/api-token/ui/revoke-api-token-dialog'
import { SettingsLayout } from '@modules/settings/layout/settings-layout'
import { ContentSection } from '@modules/settings/ui/content-section'

export const APITokens: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createdToken, setCreatedToken] = useState<TCreatedAPIToken | null>(
    null
  )
  const [tokenToEdit, setTokenToEdit] = useState<TAPIToken | null>(null)
  const [tokenToRevoke, setTokenToRevoke] = useState<TAPIToken | null>(null)
  const [tokenToDelete, setTokenToDelete] = useState<TAPIToken | null>(null)

  const {
    data,
    isPending,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: apiTokenKeys.list(),
    queryFn: ({ pageParam }) => apiTokenAPI.getAll(apiTokenPageSize, pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextItems
        ? lastPage.pagination.nextCursor
        : undefined,
  })

  const tokens = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <SettingsLayout>
      <ContentSection
        title='API tokens'
        desc='Let scripts and CI scan pages as you. Each token only has the permissions you give it.'
      >
        <div className='flex justify-end'>
          <Button type='button' onClick={() => setIsCreateOpen(true)}>
            <KeyRound aria-hidden />
            Create API token
          </Button>
        </div>

        <div className='mt-4'>
          {isPending && (
            <div className='flex flex-col gap-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-10 w-full' />
              ))}
            </div>
          )}

          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {!isPending && !isError && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className='font-medium'>
                        {token.name}
                      </TableCell>
                      <TableCell>
                        <code className='text-xs'>opt_{token.prefix}_••••</code>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {token.permissions.map((permission) => (
                            <Badge key={permission} variant='secondary'>
                              {apiTokenPermissionLabels[permission]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <APITokenStatusBadge token={token} />
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {token.expiresAt
                          ? formatDateTime(token.expiresAt)
                          : 'Never'}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {token.lastUsedAt
                          ? formatDateTime(token.lastUsedAt)
                          : 'Never'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <APITokenActions
                          token={token}
                          onEdit={setTokenToEdit}
                          onRevoke={setTokenToRevoke}
                          onDelete={setTokenToDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tokens.length === 0 && (
                <p className='py-6 text-center text-sm text-muted-foreground'>
                  No API tokens yet.
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
                    Load more tokens
                    {isFetchingNextPage && <Loader2 className='animate-spin' />}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <CreateAPITokenDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={setCreatedToken}
        />
        <APITokenCreatedDialog
          token={createdToken}
          onClose={() => setCreatedToken(null)}
        />
        <EditAPITokenDialog
          token={tokenToEdit}
          onOpenChange={(isOpen) => !isOpen && setTokenToEdit(null)}
        />
        <RevokeAPITokenDialog
          token={tokenToRevoke}
          onOpenChange={(isOpen) => !isOpen && setTokenToRevoke(null)}
        />
        <DeleteAPITokenDialog
          token={tokenToDelete}
          onOpenChange={(isOpen) => !isOpen && setTokenToDelete(null)}
        />
      </ContentSection>
    </SettingsLayout>
  )
}
