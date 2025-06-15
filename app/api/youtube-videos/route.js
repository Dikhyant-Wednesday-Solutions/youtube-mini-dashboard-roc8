import { getServerSession } from 'next-auth'
import { getUserVideos, getVideoDetails } from '@/lib/youtube'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const videos = await getUserVideos(session.accessToken)
    
    // Extract video IDs for detailed information
    const videoIds = videos.map(video => video.contentDetails.videoId)
    
    // Get detailed video information
    const detailedVideos = await getVideoDetails(session.accessToken, videoIds)
    
    return Response.json({ videos: detailedVideos })
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}