'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function VideosList() {
  const { data: session } = useSession()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchVideos = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/youtube-videos')
      const data = await response.json()
      
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateVideoTitle = async (videoId, newTitle) => {
    try {
      const response = await fetch(`/api/youtube-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          updates: {
            snippet: {
              title: newTitle,
            },
          },
        }),
      })
      
      if (response.ok) {
        // Refresh the videos list
        fetchVideos()
      }
    } catch (error) {
      console.error('Error updating video:', error)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [session])

  if (!session) {
    return <p>Please sign in to view your videos</p>
  }

  return (
    <div>
      <h2>Your YouTube Videos</h2>
      <button onClick={fetchVideos} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Videos'}
      </button>
      
      <div>
        {videos.map((video) => (
          <div key={video.id} style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
            <h3>{video.snippet.title}</h3>
            <p>Views: {video.statistics.viewCount}</p>
            <p>Likes: {video.statistics.likeCount}</p>
            <p>Published: {new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
            
            <button
              onClick={() => {
                const newTitle = prompt('Enter new title:', video.snippet.title)
                if (newTitle) {
                  updateVideoTitle(video.id, newTitle)
                }
              }}
            >
              Edit Title
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}