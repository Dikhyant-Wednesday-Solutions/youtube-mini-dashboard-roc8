import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateVideoMetadata } from '@/lib/youtube'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { videoId, updates } = await request.json()
    
    const updatedVideo = await updateVideoMetadata(session.accessToken, videoId, updates)
    
    return Response.json({ video: updatedVideo })
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Failed to update video' }, { status: 500 })
  }
}