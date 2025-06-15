import { google } from 'googleapis'

export const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY, // Fallback for public data
})

export const getAuthenticatedYouTube = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.youtube({
    version: 'v3',
    auth: oauth2Client,
  })
}

// Function to get user's uploaded videos
export const getUserVideos = async (accessToken) => {
  try {
    const youtubeAuth = getAuthenticatedYouTube(accessToken)
    
    // First, get the uploads playlist ID
    const channelResponse = await youtubeAuth.channels.list({
      part: ['contentDetails'],
      mine: true,
    })
    
    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads
    
    // Then get videos from the uploads playlist
    const videosResponse = await youtubeAuth.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    })
    
    return videosResponse.data.items
  } catch (error) {
    console.error('Error fetching user videos:', error)
    throw error
  }
}

// Function to get detailed video information
export const getVideoDetails = async (accessToken, videoIds) => {
  try {
    const youtubeAuth = getAuthenticatedYouTube(accessToken)
    
    const response = await youtubeAuth.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'status'],
      id: videoIds.join(','),
    })
    
    return response.data.items
  } catch (error) {
    console.error('Error fetching video details:', error)
    throw error
  }
}

// Function to update video metadata
export const updateVideoMetadata = async (accessToken, videoId, updates) => {
  try {
    const youtubeAuth = getAuthenticatedYouTube(accessToken)
    
    const response = await youtubeAuth.videos.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: videoId,
        snippet: updates.snippet,
        status: updates.status,
      },
    })
    
    return response.data
  } catch (error) {
    console.error('Error updating video:', error)
    throw error
  }
}