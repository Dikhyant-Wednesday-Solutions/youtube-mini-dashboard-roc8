import LoginButton from '@/components/LoginButton'
import VideosList from '@/components/VideosList'

export default function Home() {
  return (
    <main style={{ padding: '20px' }}>
      <h1>YouTube Data API Integration</h1>
      <LoginButton />
      <VideosList />
    </main>
  )
}