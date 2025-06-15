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

// Valid YouTube category IDs
const VALID_CATEGORIES = [
  '1', '2', '10', '15', '17', '19', '20', '22', '23', '24', '25', '26', '27', '28'
]

// Helper function to validate category ID
const isValidCategoryId = (categoryId) => {
  return VALID_CATEGORIES.includes(categoryId?.toString())
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
    
    // First, get the current video data to preserve existing fields
    const currentVideoResponse = await youtubeAuth.videos.list({
      part: ['snippet', 'status'],
      id: videoId
    })

    if (!currentVideoResponse.data.items.length) {
      throw new Error('Video not found')
    }

    const currentVideo = currentVideoResponse.data.items[0]
    const currentSnippet = currentVideo.snippet
    const currentStatus = currentVideo.status

    // Handle both flat updates and nested snippet/status structure
    let snippetUpdates, statusUpdates

    if (updates.snippet || updates.status) {
      // Nested structure (existing format)
      snippetUpdates = updates.snippet || {}
      statusUpdates = updates.status || {}
    } else {
      // Flat structure - map to snippet/status
      snippetUpdates = {}
      statusUpdates = {}
      
      // Map flat properties to snippet
      if (updates.title !== undefined) snippetUpdates.title = updates.title
      if (updates.description !== undefined) snippetUpdates.description = updates.description
      if (updates.tags !== undefined) snippetUpdates.tags = updates.tags
      if (updates.categoryId !== undefined) snippetUpdates.categoryId = updates.categoryId
      
      // Map flat properties to status
      if (updates.privacyStatus !== undefined) statusUpdates.privacyStatus = updates.privacyStatus
    }

    // Validate category ID if provided
    if (snippetUpdates.categoryId && !isValidCategoryId(snippetUpdates.categoryId)) {
      console.warn(`Invalid category ID: ${snippetUpdates.categoryId}. Using default category.`)
      snippetUpdates.categoryId = '22' // Default to "People & Blogs"
    }

    // Build the update payload with current data as base
    const updatePayload = {
      part: ['snippet', 'status'],
      requestBody: {
        id: videoId,
        snippet: {
          ...currentSnippet,
          ...snippetUpdates
        },
        status: {
          ...currentStatus,
          ...statusUpdates
        }
      }
    }

    console.log('Updating video with payload:', JSON.stringify(updatePayload, null, 2))
    
    const response = await youtubeAuth.videos.update(updatePayload)
    
    return response.data
  } catch (error) {
    console.error('Error updating video:', error)
    
    // Enhanced error handling
    if (error.code === 400) {
      if (error.message.includes('categoryId')) {
        throw new Error('Invalid category ID. Please use a valid YouTube category ID.')
      }
      throw new Error(`YouTube API error: ${error.message}`)
    }
    
    throw error
  }
}

// Function to get valid categories for a region
export const getValidCategories = async (accessToken, regionCode = 'US') => {
  try {
    const youtubeAuth = getAuthenticatedYouTube(accessToken)
    
    const response = await youtubeAuth.videoCategories.list({
      part: ['snippet'],
      regionCode: regionCode
    })
    
    return response.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Return common categories as fallback
    return [
      { id: '1', title: 'Film & Animation' },
      { id: '2', title: 'Autos & Vehicles' },
      { id: '10', title: 'Music' },
      { id: '15', title: 'Pets & Animals' },
      { id: '17', title: 'Sports' },
      { id: '19', title: 'Travel & Events' },
      { id: '20', title: 'Gaming' },
      { id: '22', title: 'People & Blogs' },
      { id: '23', title: 'Comedy' },
      { id: '24', title: 'Entertainment' },
      { id: '25', title: 'News & Politics' },
      { id: '26', title: 'Howto & Style' },
      { id: '27', title: 'Education' },
      { id: '28', title: 'Science & Technology' }
    ]
  }
}