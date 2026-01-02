'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, LogIn } from 'lucide-react'
import AnimatedLogo from '@/components/AnimatedLogo'

interface Session {
  id: string
  code?: string
  date: string
  location: string
  seriesId?: string
  totalPoints?: number
  whiskies?: Array<{
    ratings?: Array<{
      participantId: string
    }>
  }>
}


export default function Home() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [joinError, setJoinError] = useState('')
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [skipLogo, setSkipLogo] = useState(false)

  useEffect(() => {
    // Check if we should skip the logo animation (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('skipLogo') === 'true') {
      setSkipLogo(true)
      // Clean up the URL parameter
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    // Get participant ID from localStorage
    const storedId = localStorage.getItem('participantId')
    setParticipantId(storedId)

    fetch('http://localhost:3001/api/sessions')
      .then(res => res.json())
      .then(data => {
        // Only show sessions where the user has participated (has ratings)
        if (storedId) {
          const userSessions = data.filter((session: Session) => {
            return session.whiskies?.some(whisky => 
              whisky.ratings?.some(rating => rating.participantId === storedId)
            )
          })
          setSessions(userSessions)
        } else {
          // If no participant ID, show no sessions
          setSessions([])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching sessions:', err)
        setLoading(false)
      })
  }, [])

  const handleJoinSession = async () => {
    const code = sessionId.trim().toUpperCase()
    if (!code || code.length !== 4) {
      setJoinError('Please enter a 4-letter session code')
      return
    }

    setJoinError('')
    
    // Validate session exists
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${code}`)
      if (response.ok) {
        router.push(`/session/${code}`)
      } else {
        setJoinError('Sessie niet gevonden. Controleer de code en probeer het opnieuw.')
      }
    } catch (error) {
      setJoinError('Fout bij deelnemen aan sessie. Probeer het opnieuw.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {!skipLogo && <AnimatedLogo />}
          <h1 className="text-5xl font-bold text-whisky-dark mb-2 font-display text-center">
            <span className="block">Guardians</span>
            <span className="block">Of</span>
            <span className="block">Whisky</span>
          </h1>
          <p className="text-whisky-dark/70 text-lg">
            Je whisky proeverij metgezel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/session/new"
            className="bg-whisky-dark text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Plus size={32} />
            <span className="text-xl font-semibold">Nieuwe Sessie Starten</span>
          </Link>
          <button
            onClick={() => setShowJoinDialog(true)}
            className="bg-whisky text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <LogIn size={32} />
            <span className="text-xl font-semibold">Sessie Deelnemen</span>
          </button>
        </div>

        {/* Join Session Dialog */}
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-whisky-dark mb-4">
                Join a Session
              </h2>
              <p className="text-gray-600 mb-4">
                Voer de 4-letter sessiecode in om deel te nemen aan een actieve proeverij.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sessiecode
                  </label>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => {
                      // Only allow letters, max 4 characters, convert to uppercase
                      const value = e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()
                      setSessionId(value)
                      setJoinError('')
                    }}
                    placeholder="ABCD"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && sessionId.length === 4) {
                        handleJoinSession()
                      }
                    }}
                    autoFocus
                  />
                  {joinError && (
                    <p className="text-red-600 text-sm mt-2">{joinError}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinSession}
                    className="flex-1 bg-whisky-dark text-white py-2 rounded-lg font-semibold hover:bg-whisky transition-colors"
                  >
                    Deelnemen
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinDialog(false)
                      setSessionId('')
                      setJoinError('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {participantId && (
          <>
            {loading ? (
              <div className="text-center py-8">Jouw sessies laden...</div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-whisky-dark mb-4">
                  Jouw Sessies
                </h2>
                {sessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/session/${session.code || session.id}`}
                    className="block bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {new Date(session.date).toLocaleDateString()}
                        </h3>
                        <p className="text-gray-600">{session.location || 'Geen locatie'}</p>
                        {session.code && (
                          <p className="text-sm text-whisky-dark font-mono font-semibold mt-1">
                            Code: {session.code}
                          </p>
                        )}
                      </div>
                      {session.totalPoints !== undefined && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-whisky">
                            {session.totalPoints}
                          </div>
                          <div className="text-sm text-gray-500">punten</div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                You haven't participated in any sessions yet. Join or create a session to get started!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

