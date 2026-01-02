'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import TastingInterface from '@/components/TastingInterface'
import WhiskyReveal from '@/components/WhiskyReveal'
import SessionHeader from '@/components/SessionHeader'
import AvatarCapture from '@/components/AvatarCapture'
import ParticipantGrid from '@/components/ParticipantGrid'
import AddWhiskyModal from '@/components/AddWhiskyModal'
import ProfileSettings from '@/components/ProfileSettings'
import Confetti from '@/components/Confetti'
import Scoreboard from '@/components/Scoreboard'
import { Trophy } from 'lucide-react'

interface PointsBreakdown {
  category: string
  value: string
  matches: number
  points: number
  matchedParticipants?: string[]
}

interface Whisky {
  id: string
  name: string
  years?: string
  type?: string
  region?: string
  description?: string
  image?: string
  revealed: boolean
  ratings: Rating[]
  points?: number
  pointsBreakdown?: PointsBreakdown[]
  pointsCalculated?: boolean
}

interface Rating {
  id: string
  participantId: string
  participantName: string
  color?: string
  nose?: string
  palate?: string
  finish?: string
  overall?: number
  flavorNotes?: string[]
  aromaIntensity?: number
  aromaSmokiness?: number
  aromaSweetness?: number
}

interface Session {
  id: string
  code?: string
  date: string
  location: string
  creatorId?: string | null
  maxFlavorNotes?: number
  whiskies: Whisky[]
  activeWhiskyId?: string | null
  totalPoints?: number
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [selectedWhisky, setSelectedWhisky] = useState<Whisky | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [participantAvatar, setParticipantAvatar] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [nameEntered, setNameEntered] = useState(false)
  const [showAvatarCapture, setShowAvatarCapture] = useState(false)
  const [participants, setParticipants] = useState<Array<{id: string, name: string, avatar?: string, currentEmote?: string}>>([])
  const [showAddWhiskyModal, setShowAddWhiskyModal] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [selectedRevealedWhiskyId, setSelectedRevealedWhiskyId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [scoreboardWhisky, setScoreboardWhisky] = useState<{ id: string, name: string, points: number, pointsBreakdown?: PointsBreakdown[] } | null>(null)
  const [showRevealedWhiskyModal, setShowRevealedWhiskyModal] = useState(false)
  const [revealedWhiskyData, setRevealedWhiskyData] = useState<Whisky | null>(null)
  const [sessionDataLoaded, setSessionDataLoaded] = useState(false)
  const [showToastAnimation, setShowToastAnimation] = useState(false)
  const [toastPressCount, setToastPressCount] = useState(0)
  const [hasPressedToast, setHasPressedToast] = useState(false)
  const toastResetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get or create participant ID
    const storedId = localStorage.getItem('participantId')
    const storedName = localStorage.getItem('participantName')
    
    if (storedId) {
      setParticipantId(storedId)
    } else {
      const newId = crypto.randomUUID()
      setParticipantId(newId)
      localStorage.setItem('participantId', newId)
    }
    
    const storedAvatar = localStorage.getItem('participantAvatar')
    
    if (storedName) {
      setParticipantName(storedName)
      setNameEntered(true)
    }
    
    if (storedAvatar) {
      setParticipantAvatar(storedAvatar)
    }

    // Fetch session
    fetch(`http://localhost:3001/api/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        // Ensure whiskies is always an array
        if (!data.whiskies) {
          data.whiskies = []
        }
        setSession(data)
        setSessionDataLoaded(true)
        // Join WebSocket room using session ID (not code)
        const socket = getSocket()
        socket.emit('join:session', data.id)
      })
      .catch(err => {
        console.error('Error fetching session:', err)
        setSessionDataLoaded(true)
      })

    // Setup WebSocket listeners
    const socket = getSocket()

    // Handle reconnection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      // Re-join session room on reconnect
      if (session) {
        socket.emit('join:session', session.id)
        // Re-register participant if we have name and avatar
        if (participantName && participantId && nameEntered) {
          socket.emit('participant:join', {
            sessionId: session.id,
            participant: {
              id: participantId,
              name: participantName.trim(),
              avatar: participantAvatar
            }
          })
        }
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      // Re-join session room on reconnect
      if (session) {
        socket.emit('join:session', session.id)
        // Re-register participant if we have name and avatar
        if (participantName && participantId && nameEntered) {
          socket.emit('participant:join', {
            sessionId: session.id,
            participant: {
              id: participantId,
              name: participantName.trim(),
              avatar: participantAvatar
            }
          })
        }
      }
    })

    socket.on('whisky:added', (whisky: Whisky) => {
      setSession(prev => prev ? {
        ...prev,
        whiskies: [...prev.whiskies, whisky]
      } : null)
    })

    socket.on('rating:updated', (data: { whiskyId: string, rating: Rating, totalPoints: number, pointsBreakdown?: Array<{category: string, value: string, matches: number, points: number}> }) => {
      setSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          whiskies: prev.whiskies.map(w => 
            w.id === data.whiskyId
              ? { ...w, ratings: [...w.ratings.filter(r => r.participantId !== data.rating.participantId), data.rating], pointsBreakdown: data.pointsBreakdown }
              : w
          ),
          totalPoints: data.totalPoints
        }
      })
    })

        socket.on('whisky:activated', (data: { whiskyId: string, whisky: Whisky }) => {
          setSession(prev => {
            if (!prev) return null
            return {
              ...prev,
              activeWhiskyId: data.whiskyId,
              whiskies: prev.whiskies.map(w =>
                w.id === data.whiskyId ? data.whisky : w
              )
            }
          })
        })

        socket.on('whisky:cancelled', (data: { whiskyId: string, whisky: Whisky }) => {
          setSession(prev => {
            if (!prev) return null
            return {
              ...prev,
              activeWhiskyId: prev.activeWhiskyId === data.whiskyId ? null : prev.activeWhiskyId,
              whiskies: prev.whiskies.map(w =>
                w.id === data.whiskyId ? data.whisky : w
              )
            }
          })
        })

        socket.on('whisky:revealed', (data: { whiskyId: string, whisky: Whisky, whiskyPoints: number, totalPoints: number, pointsBreakdown?: PointsBreakdown[] }) => {
          console.log('Whisky revealed event received:', data)
          setShowConfetti(true)
          setSession(prev => {
            if (!prev) return null
            const updatedWhiskies = prev.whiskies.map(w =>
              w.id === data.whiskyId
                ? { ...data.whisky, revealed: true, points: data.whiskyPoints, pointsBreakdown: data.pointsBreakdown }
                : w
            )
            return {
              ...prev,
              activeWhiskyId: prev.activeWhiskyId === data.whiskyId ? null : prev.activeWhiskyId,
              totalPoints: data.totalPoints,
              whiskies: updatedWhiskies
            }
          })
          // Store revealed whisky data and show modal after confetti
          setTimeout(() => {
            setRevealedWhiskyData(data.whisky)
            setShowRevealedWhiskyModal(true)
            // Store scoreboard data for later
            setScoreboardWhisky({
              id: data.whiskyId,
              name: data.whisky.name,
              points: data.whiskyPoints,
              pointsBreakdown: data.pointsBreakdown
            })
          }, 500)
        })

    socket.on('participant:joined', (data: { participant: {id: string, name: string, avatar?: string} }) => {
      setParticipants(prev => {
        if (prev.find(p => p.id === data.participant.id)) return prev
        return [...prev, { ...data.participant, currentEmote: undefined }]
      })
    })

    socket.on('participants:list', (data: { participants: Array<{id: string, name: string, avatar?: string}> }) => {
      setParticipants(data.participants.map(p => ({ ...p, currentEmote: undefined })))
    })

    socket.on('participant:left', (data: { participantId: string }) => {
      setParticipants(prev => prev.filter(p => p.id !== data.participantId))
    })

    socket.on('participant:kicked', (data: { participantId: string, reason?: string }) => {
      if (data.participantId === participantId) {
        // This participant was kicked
        alert('Je bent verwijderd uit de sessie door de maker.')
        router.push('/')
      } else {
        // Another participant was kicked
        setParticipants(prev => prev.filter(p => p.id !== data.participantId))
      }
    })

    socket.on('participant:updated', (data: { participant: { id: string, name: string, avatar?: string } }) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.participant.id 
          ? { ...p, name: data.participant.name, avatar: data.participant.avatar }
          : p
      ))
    })

        socket.on('emote', (data: { participantId: string, emote: string }) => {
          setParticipants(prev => prev.map(p =>
            p.id === data.participantId
              ? { ...p, currentEmote: data.emote }
              : p
          ))
          // Clear emote after 3 seconds
          setTimeout(() => {
            setParticipants(prev => prev.map(p =>
              p.id === data.participantId
                ? { ...p, currentEmote: undefined }
                : p
            ))
          }, 3000)
        })

        socket.on('toast:pressed', (data: { participantId: string, pressedCount: number, totalCount: number }) => {
          setToastPressCount(data.pressedCount)
        })

        socket.on('toast:success', () => {
          // Clear any pending reset timeout
          if (toastResetTimeoutRef.current) {
            clearTimeout(toastResetTimeoutRef.current)
            toastResetTimeoutRef.current = null
          }
          // Play cheerful sound
          playCheerfulSound()
          setShowToastAnimation(true)
          setToastPressCount(0)
          setHasPressedToast(false)
          // Hide animation after 5 seconds
          setTimeout(() => {
            setShowToastAnimation(false)
          }, 5000)
        })

        socket.on('toast:reset', () => {
          // Clear any pending reset timeout
          if (toastResetTimeoutRef.current) {
            clearTimeout(toastResetTimeoutRef.current)
            toastResetTimeoutRef.current = null
          }
          setToastPressCount(0)
          setHasPressedToast(false)
        })

        socket.on('session:updated', (updatedSession: Session) => {
          setSession(updatedSession)
        })

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('reconnect')
        socket.off('whisky:added')
        socket.off('rating:updated')
        socket.off('whisky:activated')
        socket.off('whisky:cancelled')
        socket.off('whisky:revealed')
        socket.off('participant:joined')
        socket.off('participants:list')
        socket.off('participant:left')
        socket.off('participant:updated')
        socket.off('emote')
        socket.off('toast:pressed')
        socket.off('toast:success')
        socket.off('toast:reset')
        // Clear toast reset timeout on unmount
        if (toastResetTimeoutRef.current) {
          clearTimeout(toastResetTimeoutRef.current)
          toastResetTimeoutRef.current = null
        }
      }
    }, [sessionId, session, participantName, participantId, participantAvatar, nameEntered])

  // Define functions before conditional returns
  const handleAvatarCapture = (imageData: string) => {
    setParticipantAvatar(imageData)
    localStorage.setItem('participantAvatar', imageData)
    setShowAvatarCapture(false)
  }

  const joinSession = () => {
    if (!session || !participantName.trim() || participants.find(p => p.id === participantId)) return
    
    const socket = getSocket()
    socket.emit('participant:join', {
      sessionId: session.id,
      participant: {
        id: participantId,
        name: participantName.trim(),
        avatar: participantAvatar
      }
    })
  }

  const handleEmote = (emote: string) => {
    if (!session) return
    const socket = getSocket()
    socket.emit('emote', {
      sessionId: session.id,
      participantId: participantId,
      emote: emote
    })
  }

  const handleKickParticipant = async (kickedParticipantId: string) => {
    if (!session) return
    const sessionIdentifier = session.code || session.id
    
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/participants/${kickedParticipantId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: participantId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to kick participant')
        console.error('Kick error:', error)
      }
    } catch (error) {
      console.error('Error kicking participant:', error)
      alert('Failed to kick participant')
    }
  }

  const playCheerfulSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create a cheerful ascending melody (like a toast/celebration sound)
      const frequencies = [523.25, 659.25, 783.99, 1046.50] // C, E, G, C (major chord)
      const duration = 0.15
      const startTime = audioContext.currentTime
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = freq
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, startTime + index * duration)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + index * duration + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration)
        
        oscillator.start(startTime + index * duration)
        oscillator.stop(startTime + index * duration + duration)
      })
    } catch (error) {
      console.log('Could not play sound:', error)
    }
  }

  const handleToastPress = () => {
    if (!session || hasPressedToast) return
    const socket = getSocket()
    setHasPressedToast(true)
    socket.emit('toast:press', {
      sessionId: session.id,
      participantId: participantId
    })
    
    // Auto-reset after 3 seconds if no success
    if (toastResetTimeoutRef.current) {
      clearTimeout(toastResetTimeoutRef.current)
    }
    toastResetTimeoutRef.current = setTimeout(() => {
      setToastPressCount(0)
      setHasPressedToast(false)
      toastResetTimeoutRef.current = null
    }, 3000)
  }

  const handleAddWhisky = async (whisky: { name: string, years?: string, type?: string, region?: string, description?: string, image?: string }) => {
    if (!session) return
    try {
      const sessionIdentifier = session.code || session.id
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/whisky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whisky)
      })
      if (!response.ok) {
        throw new Error('Failed to add whisky')
      }
    } catch (error) {
      console.error('Error adding whisky:', error)
      throw error
    }
  }

  const handleUpdateProfile = (name: string, avatar: string) => {
    setParticipantName(name)
    setParticipantAvatar(avatar)
    localStorage.setItem('participantName', name)
    localStorage.setItem('participantAvatar', avatar)
    
    // Update participant in the session via WebSocket
    if (session) {
      const socket = getSocket()
      socket.emit('participant:update', {
        sessionId: session.id,
        participant: {
          id: participantId,
          name: name,
          avatar: avatar
        }
      })
    }
  }

  // Join session when component mounts with name and avatar
  // This must be before any conditional returns
  useEffect(() => {
    if (session && nameEntered && (participantAvatar || !showAvatarCapture) && !participants.find(p => p.id === participantId)) {
      joinSession()
    }
  }, [session, nameEntered, participantAvatar, showAvatarCapture, participantId, participants, participantName])

  // Only show content when data is loaded
  useEffect(() => {
    if (sessionDataLoaded) {
      setLoading(false)
    }
  }, [sessionDataLoaded])

  // All conditional returns must come after all hooks
  if (loading || !sessionDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center">
        <div className="text-xl text-whisky-dark">Sessie laden...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-xl">Sessie niet gevonden</div>
      </div>
    )
  }

  if (!nameEntered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Voer Je Naam In</h2>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Je naam"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && participantName.trim()) {
                localStorage.setItem('participantName', participantName.trim())
                setNameEntered(true)
                setShowAvatarCapture(true)
              }
            }}
          />
          <button
            onClick={() => {
              if (participantName.trim()) {
                localStorage.setItem('participantName', participantName.trim())
                setNameEntered(true)
                setShowAvatarCapture(true)
              }
            }}
            disabled={!participantName.trim()}
            className="w-full bg-whisky-dark text-white py-2 rounded-lg disabled:opacity-50"
          >
            Doorgaan
          </button>
        </div>
      </div>
    )
  }

  if (showAvatarCapture && !participantAvatar) {
    return (
      <AvatarCapture
        onCapture={handleAvatarCapture}
        onCancel={() => {
          setShowAvatarCapture(false)
          setNameEntered(false)
        }}
      />
    )
  }

  const activeWhisky = session.activeWhiskyId && session.whiskies
    ? session.whiskies.find(w => w.id === session.activeWhiskyId && !w.revealed)
    : null
  const myRating = activeWhisky?.ratings?.find(r => r.participantId === participantId)
  const unrevealedWhiskies = (session.whiskies || []).filter(w => !w.revealed)
  
  const handleActivateWhisky = async (whiskyId: string) => {
    if (!session) return
    try {
      const sessionIdentifier = session.code || session.id
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/whisky/${whiskyId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: participantId
        })
      })
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to activate whisky')
        console.error('Error activating whisky:', error)
      }
    } catch (error) {
      console.error('Error activating whisky:', error)
      alert('Error activating whisky')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
          <SessionHeader 
            session={session} 
            participantName={participantName} 
            isCreator={session.creatorId === participantId}
            onRefresh={() => {
              // Hard refresh the page
              window.location.reload()
            }}
            onSessionUpdate={(updatedSession) => {
              setSession(updatedSession)
            }}
          />
      
      <div className="container mx-auto px-4 py-6">
        {/* Profile Settings Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowProfileSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-whisky-dark"
          >
            <span>Profiel Bewerken</span>
          </button>
        </div>

        {/* Add Whisky Button - Creator Only */}
        {session.creatorId === participantId && (
          <div className="mb-4">
            <button
              onClick={() => setShowAddWhiskyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-whisky-dark text-white rounded-lg hover:bg-whisky transition-colors"
            >
              <span>+ Whisky Toevoegen</span>
            </button>
          </div>
        )}

        <ParticipantGrid
          participants={participants}
          currentParticipantId={participantId}
          creatorId={session.creatorId}
          onEmote={handleEmote}
          onKick={handleKickParticipant}
          isCreator={session.creatorId === participantId}
        />

        {/* Slàinte mhath Button */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 text-center">
          <button
            onClick={handleToastPress}
            disabled={hasPressedToast || participants.length < 2}
            className={`px-8 py-4 rounded-lg font-semibold text-xl transition-all transform ${
              hasPressedToast
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : participants.length < 2
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-whisky-dark text-white hover:bg-whisky hover:scale-105 shadow-lg'
            }`}
          >
            🥃 Slàinte mhath!
          </button>
          {participants.length >= 2 && (
            <p className="text-sm text-gray-600 mt-2">
              {hasPressedToast ? (
                <span className="text-whisky-dark font-semibold">
                  Wachten op anderen... ({toastPressCount}/{participants.length})
                </span>
              ) : (
                <span>
                  Druk allemaal binnen 3 seconden! ({toastPressCount}/{participants.length})
                </span>
              )}
            </p>
          )}
          {participants.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">
              Minimaal 2 deelnemers nodig
            </p>
          )}
        </div>

        {/* Whisky Selection List - Show all whiskies for creator */}
        {!activeWhisky && session.whiskies && session.whiskies.length > 0 && session.creatorId === participantId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-whisky-dark mb-4">
              Whisky Status & Selectie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {session.whiskies.map((whisky, index) => {
                    const hasMyRating = whisky.ratings.some(r => r.participantId === participantId)
                    const ratingCount = whisky.ratings.length
                    const isRevealed = whisky.revealed
                    const isUnrevealed = !isRevealed
                
                // Calculate average stars based on overall ratings
                const averageStars = ratingCount > 0
                  ? Math.round((whisky.ratings.reduce((acc, r) => acc + (r.overall || 0), 0) / ratingCount) * 10) / 10 // Round to 1 decimal
                  : 0
                
                // Calculate most popular color
                const colorCounts: Record<string, number> = {}
                whisky.ratings.forEach(r => {
                  if (r.color) {
                    colorCounts[r.color] = (colorCounts[r.color] || 0) + 1
                  }
                })
                const mostPopularColor = Object.entries(colorCounts)
                  .sort(([, a], [, b]) => b - a)[0]
                const topColor = mostPopularColor && mostPopularColor[1] > 1 ? mostPopularColor[0] : null
                
                // Calculate flavor notes selected by more than one person
                const noteCounts: Record<string, number> = {}
                whisky.ratings.forEach(r => {
                  if (r.flavorNotes && Array.isArray(r.flavorNotes)) {
                    r.flavorNotes.forEach(note => {
                      noteCounts[note] = (noteCounts[note] || 0) + 1
                    })
                  }
                })
                const popularNotes = Object.entries(noteCounts)
                  .filter(([, count]) => count > 1)
                  .sort(([, a], [, b]) => b - a)
                  .map(([note]) => note)
                
                return (
                  <div
                    key={whisky.id}
                    className={`p-4 border-2 rounded-lg relative ${
                      isRevealed
                        ? hasMyRating
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-purple-300 bg-purple-50/50'
                        : hasMyRating 
                        ? 'border-green-400 bg-green-50' 
                        : ratingCount > 0
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-whisky-light'
                    } ${isUnrevealed ? 'hover:border-whisky-dark hover:bg-whisky-light/20 transition-all cursor-pointer' : isRevealed ? 'hover:border-purple-500 hover:bg-purple-100 transition-all cursor-pointer' : ''}`}
                    onClick={isUnrevealed ? () => handleActivateWhisky(whisky.id) : isRevealed ? () => setSelectedRevealedWhiskyId(selectedRevealedWhiskyId === whisky.id ? null : whisky.id) : undefined}
                  >
                    {hasMyRating && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    {isRevealed && (
                      <div className="absolute top-2 left-2 bg-purple-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                        REVEALED
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      {whisky.image ? (
                        <img
                          src={whisky.image}
                          alt={whisky.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-whisky-light rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-whisky-dark">
                            {whisky.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-whisky-dark mb-1">
                          {whisky.name}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {whisky.years && `${whisky.years} jaar`}
                          {whisky.years && whisky.type && ' • '}
                          {whisky.type}
                          {whisky.region && (whisky.years || whisky.type) && ' • '}
                          {whisky.region}
                        </div>
                        <div className="text-xs mt-1">
                          {isRevealed ? (
                            <span className="text-purple-600 font-semibold">✓ Revealed</span>
                          ) : hasMyRating ? (
                            <span className="text-green-600 font-semibold">✓ You rated this</span>
                          ) : ratingCount > 0 ? (
                            <span className="text-blue-600">{ratingCount} participant{ratingCount !== 1 ? 's' : ''} rated</span>
                          ) : (
                            <span className="text-gray-500">Not yet rated</span>
                          )}
                        </div>
                        {isRevealed && whisky.points !== undefined && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Trophy className="text-amber-500" size={16} />
                                <span className="text-sm font-bold text-whisky-dark">
                                  {whisky.points} punten
                                </span>
                              </div>
                              {averageStars > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600 mr-1">{averageStars.toFixed(1)}</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-lg ${
                                          star <= Math.round(averageStars)
                                            ? 'text-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {isUnrevealed && (
                          <div className="text-xs text-whisky-dark mt-1 italic">
                            Klik om te activeren
                          </div>
                        )}
                        
                        {/* Popular Color and Flavor Notes Badges */}
                        {(topColor || popularNotes.length > 0) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            {topColor && (
                              <div className="mb-1">
                                <span className="text-xs text-gray-500">Top Kleur: </span>
                                <span className="text-xs font-semibold text-whisky-dark bg-amber-100 px-2 py-0.5 rounded">
                                  {topColor}
                                </span>
                              </div>
                            )}
                            {popularNotes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {popularNotes.slice(0, 3).map(note => (
                                  <span
                                    key={note}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                  >
                                    {note}
                                  </span>
                                ))}
                                {popularNotes.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{popularNotes.length - 3} meer
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Whiskey Status List - Show all whiskys (unrevealed and revealed) for all users */}
        {!activeWhisky && session.whiskies && session.whiskies.length > 0 && session.creatorId !== participantId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-whisky-dark mb-4">
              Whisky Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {session.whiskies.map((whisky, index) => {
                const hasMyRating = whisky.ratings.some(r => r.participantId === participantId)
                const ratingCount = whisky.ratings.length
                const isRevealed = whisky.revealed
                
                // Calculate average stars based on overall ratings
                const averageStars = ratingCount > 0
                  ? Math.round((whisky.ratings.reduce((acc, r) => acc + (r.overall || 0), 0) / ratingCount) * 10) / 10 // Round to 1 decimal
                  : 0
                
                // Calculate most popular color
                const colorCounts: Record<string, number> = {}
                whisky.ratings.forEach(r => {
                  if (r.color) {
                    colorCounts[r.color] = (colorCounts[r.color] || 0) + 1
                  }
                })
                const mostPopularColor = Object.entries(colorCounts)
                  .sort(([, a], [, b]) => b - a)[0]
                const topColor = mostPopularColor && mostPopularColor[1] > 1 ? mostPopularColor[0] : null
                
                // Calculate flavor notes selected by more than one person
                const noteCounts: Record<string, number> = {}
                whisky.ratings.forEach(r => {
                  if (r.flavorNotes && Array.isArray(r.flavorNotes)) {
                    r.flavorNotes.forEach(note => {
                      noteCounts[note] = (noteCounts[note] || 0) + 1
                    })
                  }
                })
                const popularNotes = Object.entries(noteCounts)
                  .filter(([, count]) => count > 1)
                  .sort(([, a], [, b]) => b - a)
                  .map(([note]) => note)
                
                return (
                  <div
                    key={whisky.id}
                    className={`p-4 border-2 rounded-lg relative ${
                      isRevealed
                        ? hasMyRating
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-purple-300 bg-purple-50/50'
                        : hasMyRating
                        ? 'border-green-400 bg-green-50'
                        : ratingCount > 0
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    } ${isRevealed ? 'hover:border-purple-500 hover:bg-purple-100 transition-all cursor-pointer' : ''}`}
                    onClick={isRevealed ? () => setSelectedRevealedWhiskyId(selectedRevealedWhiskyId === whisky.id ? null : whisky.id) : undefined}
                  >
                    {hasMyRating && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    {isRevealed && (
                      <div className="absolute top-2 left-2 bg-purple-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                        REVEALED
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      {isRevealed && whisky.image ? (
                        <img
                          src={whisky.image}
                          alt={whisky.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-whisky-light rounded-lg flex items-center justify-center opacity-50">
                          <span className="text-2xl font-bold text-whisky-dark">????</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-whisky-dark mb-1">
                          {isRevealed ? whisky.name : `Whiskey #${index + 1}`}
                        </div>
                        {isRevealed && (
                          <div className="text-xs text-gray-600 mb-1">
                            {whisky.years && `${whisky.years} jaar`}
                            {whisky.years && whisky.type && ' • '}
                            {whisky.type}
                            {whisky.region && (whisky.years || whisky.type) && ' • '}
                            {whisky.region}
                          </div>
                        )}
                        <div className="text-xs mt-1">
                          {isRevealed ? (
                            <span className="text-purple-600 font-semibold">✓ Revealed</span>
                          ) : hasMyRating ? (
                            <span className="text-green-600 font-semibold">✓ You rated this</span>
                          ) : ratingCount > 0 ? (
                            <span className="text-blue-600">{ratingCount} participant{ratingCount !== 1 ? 's' : ''} rated</span>
                          ) : (
                            <span className="text-gray-500">Not yet rated</span>
                          )}
                        </div>
                        {isRevealed && whisky.points !== undefined && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Trophy className="text-amber-500" size={16} />
                                <span className="text-sm font-bold text-whisky-dark">
                                  {whisky.points} punten
                                </span>
                              </div>
                              {averageStars > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600 mr-1">{averageStars.toFixed(1)}</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-lg ${
                                          star <= Math.round(averageStars)
                                            ? 'text-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Popular Color and Flavor Notes Badges */}
                        {(topColor || popularNotes.length > 0) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            {topColor && (
                              <div className="mb-1">
                                <span className="text-xs text-gray-500">Top Kleur: </span>
                                <span className="text-xs font-semibold text-whisky-dark bg-amber-100 px-2 py-0.5 rounded">
                                  {topColor}
                                </span>
                              </div>
                            )}
                            {popularNotes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {popularNotes.slice(0, 3).map(note => (
                                  <span
                                    key={note}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                  >
                                    {note}
                                  </span>
                                ))}
                                {popularNotes.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{popularNotes.length - 3} meer
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeWhisky ? (
          <>
            {myRating ? (
              <div className="text-center py-8">
                <p className="text-xl mb-4">Wachten tot anderen klaar zijn met beoordelen...</p>
                <div className="max-w-2xl mx-auto">
                  {(() => {
                    const currentWhisky = session.whiskies?.find(w => w.id === activeWhisky.id)
                    if (!currentWhisky) return null

                    const ratedParticipantIds = new Set(currentWhisky.ratings.map(r => r.participantId))
                    const ratedParticipants = participants.filter(p => ratedParticipantIds.has(p.id))
                    const notRatedParticipants = participants.filter(p => !ratedParticipantIds.has(p.id))
                    
                    return (
                      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Participants who have rated */}
                          <div>
                            <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              Beoordeeld ({ratedParticipants.length})
                            </h4>
                            <div className="space-y-2">
                              {ratedParticipants.length > 0 ? (
                                ratedParticipants.map(p => (
                                  <div key={p.id} className="flex items-center gap-2 text-sm">
                                    {p.avatar ? (
                                      <img
                                        src={p.avatar}
                                        alt={p.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-whisky-light flex items-center justify-center">
                                        <span className="text-xs font-bold text-whisky-dark">
                                          {p.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className={p.id === participantId ? 'font-semibold' : ''}>
                                      {p.name} {p.id === participantId && '(You)'}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-400 text-sm">Nog niemand heeft beoordeeld</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Participants who haven't rated */}
                          <div>
                            <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                              <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                              Nog Bezig ({notRatedParticipants.length})
                            </h4>
                            <div className="space-y-2">
                              {notRatedParticipants.length > 0 ? (
                                notRatedParticipants.map(p => (
                                  <div key={p.id} className="flex items-center gap-2 text-sm">
                                    {p.avatar ? (
                                      <img
                                        src={p.avatar}
                                        alt={p.name}
                                        className="w-8 h-8 rounded-full object-cover opacity-75"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center opacity-75">
                                        <span className="text-xs font-bold text-gray-600">
                                          {p.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-gray-600">{p.name}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-green-600 text-sm font-semibold">Iedereen heeft beoordeeld! 🎉</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <p className="text-gray-600 mb-6">
                  {session.whiskies?.find(w => w.id === activeWhisky.id)?.ratings?.length || 0} van {participants.length} deelnemer(s) heeft beoordeeld
                </p>
                {session.creatorId === participantId ? (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={async () => {
                        if (!session || !activeWhisky) return
                        if (confirm('Weet je zeker dat je deze whisky wilt annuleren? Alle beoordelingen worden gewist.')) {
                          const sessionIdentifier = session.code || session.id
                          try {
                            const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/whisky/${activeWhisky.id}/cancel`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                participantId: participantId
                              })
                            })
                            if (!response.ok) {
                              const error = await response.json()
                              alert(error.error || 'Failed to cancel whisky')
                              console.error('Cancel error:', error)
                            } else {
                              // Success - the WebSocket event will update the UI
                              console.log('Whiskey cancel request sent successfully')
                            }
                          } catch (error) {
                            console.error('Error cancelling whisky:', error)
                            alert('Error cancelling whisky: ' + (error instanceof Error ? error.message : 'Unknown error'))
                          }
                        }
                      }}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Whisky Annuleren
                    </button>
                    <button
                      onClick={async () => {
                        if (!session || !activeWhisky) return
                        if (confirm('Weet je zeker dat je deze whisky wilt onthullen?')) {
                          const sessionIdentifier = session.code || session.id
                          try {
                            const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/whisky/${activeWhisky.id}/reveal`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                participantId: participantId
                              })
                            })
                            if (!response.ok) {
                              const error = await response.json()
                              alert(error.error || 'Failed to reveal whisky')
                              console.error('Reveal error:', error)
                            } else {
                              // Success - the WebSocket event will update the UI
                              console.log('Whiskey reveal request sent successfully')
                              // Fallback: refresh session data after a short delay
                              setTimeout(async () => {
                                try {
                                  const refreshResponse = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}`)
                                  if (refreshResponse.ok) {
                                    const refreshedSession = await refreshResponse.json()
                                    setSession(refreshedSession)
                                  }
                                } catch (err) {
                                  console.error('Error refreshing session:', err)
                                }
                              }, 500)
                            }
                          } catch (error) {
                            console.error('Error revealing whisky:', error)
                            alert('Error revealing whisky: ' + (error instanceof Error ? error.message : 'Unknown error'))
                          }
                        }
                      }}
                      className="bg-whisky-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-whisky transition-colors"
                    >
                      Whisky Onthullen
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Wachten tot de sessie maker de whisky onthult...</p>
                )}
              </div>
            ) : (
              <TastingInterface
                sessionId={session.code || session.id}
                whiskyId={activeWhisky.id}
                participantId={participantId}
                participantName={participantName}
                existingRating={myRating}
                maxFlavorNotes={session.maxFlavorNotes || 3}
              />
            )}
          </>
        ) : !activeWhisky && unrevealedWhiskies.length > 0 && session.creatorId !== participantId ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-lg p-6">
            <p className="text-xl mb-4 text-gray-600">Wachten tot de sessie maker een whisky selecteert...</p>
            <p className="text-gray-500">De maker zal kiezen welke whisky als volgende geproefd wordt.</p>
          </div>
        ) : !activeWhisky && unrevealedWhiskies.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-lg p-6">
            <p className="text-xl mb-4 text-gray-600">Nog geen whisky beschikbaar om in te vullen</p>
            <p className="text-gray-500 mb-6">Alle whiskys zijn onthuld of er zijn nog geen whiskys toegevoegd.</p>
          </div>
        ) : null}

        {/* Confetti Animation */}
        {showConfetti && (
          <Confetti onComplete={() => setShowConfetti(false)} />
        )}

        {/* Revealed Whisky Modal */}
        {showRevealedWhiskyModal && revealedWhiskyData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 text-center">
                {revealedWhiskyData.image && (
                  <motion.img
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    src={revealedWhiskyData.image}
                    alt={revealedWhiskyData.name}
                    className="w-64 h-64 md:w-80 md:h-80 object-contain mx-auto mb-6 rounded-lg shadow-lg"
                  />
                )}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-bold text-whisky-dark mb-4 font-display"
                >
                  {revealedWhiskyData.name}
                </motion.h2>
                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                  {revealedWhiskyData.years && (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="px-4 py-2 bg-whisky-light rounded-full text-lg font-semibold text-whisky-dark"
                    >
                      {revealedWhiskyData.years} jaar
                    </motion.span>
                  )}
                  {revealedWhiskyData.type && (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="px-4 py-2 bg-whisky-light rounded-full text-lg text-whisky-dark"
                    >
                      {revealedWhiskyData.type}
                    </motion.span>
                  )}
                  {revealedWhiskyData.region && (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="px-4 py-2 bg-whisky-light rounded-full text-lg text-whisky-dark"
                    >
                      {revealedWhiskyData.region}
                    </motion.span>
                  )}
                </div>
                {revealedWhiskyData.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto italic"
                  >
                    {revealedWhiskyData.description}
                  </motion.p>
                )}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => {
                    setShowRevealedWhiskyModal(false)
                    setShowScoreboard(true)
                  }}
                  className="px-8 py-4 bg-whisky-dark text-white rounded-lg font-semibold text-xl hover:bg-whisky transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Naar Scorebord
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Toast Success Animation */}
        {showToastAnimation && (
          <>
            <Confetti />
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <div className="text-9xl mb-4">🥃</div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-6xl font-bold text-white mb-2"
                >
                  Slàinte mhath!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl text-white/90"
                >
                  Proost! 🎉
                </motion.p>
              </motion.div>
            </div>
          </>
        )}

        {/* Scoreboard */}
        {showScoreboard && scoreboardWhisky && (
          <Scoreboard
            whisky={scoreboardWhisky}
            totalPoints={session.totalPoints ?? 0}
            onClose={() => {
              setShowScoreboard(false)
              setScoreboardWhisky(null)
            }}
          />
        )}

        {/* Selected Revealed Whisky */}
        {/* Revealed Whisky Details Modal */}
        {selectedRevealedWhiskyId && !showScoreboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              {(() => {
                const selectedWhisky = session.whiskies?.find(w => w.id === selectedRevealedWhiskyId && w.revealed)
                if (!selectedWhisky) return null
                const hasMyRating = selectedWhisky.ratings.some(r => r.participantId === participantId)
                return (
                  <>
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                      <h3 className="text-2xl font-semibold text-whisky-dark">
                        Onthulde Whisky Details
                      </h3>
                      {hasMyRating && (
                        <div className="bg-green-500 text-white rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1 shadow-lg">
                          <span>✓</span>
                          <span>Je hebt beoordeeld</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedRevealedWhiskyId(null)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Sluiten"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <WhiskyReveal whisky={selectedWhisky} />
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Add Whisky Modal */}
      {showAddWhiskyModal && (
        <AddWhiskyModal
          onAdd={handleAddWhisky}
          onClose={() => setShowAddWhiskyModal(false)}
        />
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          currentName={participantName}
          currentAvatar={participantAvatar}
          onSave={handleUpdateProfile}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  )
}

