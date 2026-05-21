import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'

export type ActiveMode = 'solo' | 'together'

export function useActiveProfile() {
  const profileIdRaw = localStorage.getItem('activeProfileId')
  const profileId = profileIdRaw ? Number(profileIdRaw) : undefined
  const mode = (localStorage.getItem('activeMode') as ActiveMode | null) ?? 'solo'

  const profile = useLiveQuery(
    async () => (profileId ? await db.profiles.get(profileId) : undefined),
    [profileId],
  )

  return { profile, profileId, mode }
}
