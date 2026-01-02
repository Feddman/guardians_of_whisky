'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Calendar, MapPin, Share2, Check, ChevronDown, ChevronUp, User, RefreshCw, Settings } from 'lucide-react'
import PointsBreakdown from './PointsBreakdown'

interface Whisky {
  id: string
  name: string
  revealed: boolean
  ratings: any[]
}

interface PointsBreakdown {
  category: string
  value: string
  matches: number
  points: number
  matchedParticipants?: string[]
}

interface WhiskyWithBreakdown extends Whisky {
  points?: number
  pointsBreakdown?: PointsBreakdown[]
  pointsCalculated?: boolean
}

interface Session {
  id: string
  code?: string
  date: string
  location: string
  whiskies: WhiskyWithBreakdown[]
  totalPoints?: number
  maxFlavorNotes?: number
}

interface SessionHeaderProps {
  session: Session
  participantName?: string
  isCreator?: boolean
  onRefresh?: () => void
  onSessionUpdate?: (session: Session) => void
}

export default function SessionHeader({ session, participantName, isCreator, onRefresh, onSessionUpdate }: SessionHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [maxFlavorNotes, setMaxFlavorNotes] = useState(session.maxFlavorNotes || 3)
  const [saving, setSaving] = useState(false)

  // Collect points breakdowns grouped by whisky
  const whiskyBreakdowns: Array<{
    name: string
    points: number
    breakdown: PointsBreakdown[]
  }> = []
  session.whiskies.forEach(whisky => {
    if (whisky.revealed && whisky.points !== undefined && whisky.pointsBreakdown && whisky.pointsBreakdown.length > 0) {
      whiskyBreakdowns.push({
        name: whisky.name,
        points: whisky.points,
        breakdown: whisky.pointsBreakdown
      })
    }
  })

  const handleShare = async () => {
    const sessionCode = session.code || session.id
    const sessionUrl = `${window.location.origin}/session/${sessionCode}`
    const shareText = session.code 
      ? `Join my whisky tasting session! Code: ${session.code}`
      : `Join my whisky tasting session on ${new Date(session.date).toLocaleDateString()}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my whisky tasting session!',
          text: shareText,
          url: sessionUrl,
        })
      } catch (err) {
        // User cancelled or error occurred, fall back to copy
        copyToClipboard(sessionCode)
      }
    } else {
      // Copy just the code if available, otherwise the URL
      copyToClipboard(session.code || sessionUrl)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleUpdateMaxFlavorNotes = async () => {
    if (!isCreator) return
    setSaving(true)
    try {
      const sessionIdentifier = session.code || session.id
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdentifier}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxFlavorNotes: maxFlavorNotes
        })
      })
      
      if (response.ok) {
        const updatedSession = await response.json()
        if (onSessionUpdate) {
          onSessionUpdate(updatedSession)
        }
        setShowSettings(false)
      } else {
        alert('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Error updating settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-whisky-dark text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-whisky-light transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Terug naar Home</span>
          </Link>
          <div className="flex items-center gap-4">
            {participantName && (
              <div className="flex items-center gap-2 text-sm">
                <User size={18} />
                <span className="font-medium">{participantName}</span>
              </div>
            )}
            {onRefresh && (
              <button
                onClick={async () => {
                  setRefreshing(true)
                  try {
                    await onRefresh()
                  } finally {
                    setTimeout(() => setRefreshing(false), 500)
                  }
                }}
                disabled={refreshing}
                className={`flex items-center gap-2 hover:text-whisky-light transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Vernieuwen"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                <span className="text-sm">Vernieuwen</span>
              </button>
            )}
            {isCreator && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 hover:text-whisky-light transition-colors"
                  title="Sessie instellingen"
                >
                  <Settings size={20} />
                  <span className="text-sm">Instellingen</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 hover:text-whisky-light transition-colors"
                  title="Share session"
                >
                  {copied ? (
                    <>
                      <Check size={20} />
                      <span className="text-sm">Gekopieerd!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      <span className="text-sm">Delen</span>
                    </>
                  )}
                </button>
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center gap-2 hover:text-whisky-light transition-colors"
                title="View points breakdown"
              >
                <Trophy size={24} />
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold leading-none">{session.totalPoints || 0}</span>
                  <span className="text-xs opacity-80">punten</span>
                </div>
                {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>{new Date(session.date).toLocaleDateString()}</span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{session.location}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-4">
            {session.code && (
              <div className="bg-whisky-light/20 px-3 py-1 rounded-lg">
                <span className="text-sm font-mono font-semibold">Code: {session.code}</span>
              </div>
            )}
            <span className="opacity-80">
              {session.whiskies.length} whisky{session.whiskies.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Points Breakdown */}
        {showBreakdown && (
          <div className="mt-4 pt-4 border-t border-whisky-light/30">
            {whiskyBreakdowns.length > 0 ? (
              <div className="space-y-4">
                {whiskyBreakdowns.map((whisky, index) => (
                  <div key={index} className="bg-amber-50/50 border border-whisky-light rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-whisky-dark">{whisky.name}</h4>
                      <span className="text-sm font-bold text-whisky-dark">{whisky.points} punten</span>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-whisky-light">
                      {whisky.breakdown.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            <span className="font-semibold">{item.category}:</span> {item.value}
                          </span>
                          <span className="text-whisky-dark font-semibold">
                            {item.matches} {item.matches === 1 ? 'persoon' : 'personen'} matchten
                            {item.matchedParticipants && item.matchedParticipants.length > 0 && (
                              <span className="text-xs text-gray-500 ml-1 font-normal">
                                ({item.matchedParticipants.join(', ')})
                              </span>
                            )}
                            {' '}= {item.points} punten
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                Nog geen puntenoverzicht beschikbaar
              </div>
            )}
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && isCreator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-whisky-dark mb-4">
                Sessie Instellingen
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Smaaknotities per Whisky
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={maxFlavorNotes}
                      onChange={(e) => setMaxFlavorNotes(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="w-16 text-center">
                      <span className="text-2xl font-bold text-whisky-dark">{maxFlavorNotes}</span>
                      <span className="text-xs text-gray-500 block">notities</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kies hoeveel smaaknotities deelnemers kunnen selecteren per whisky
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateMaxFlavorNotes}
                  disabled={saving}
                  className="flex-1 bg-whisky-dark text-white py-2 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    setMaxFlavorNotes(session.maxFlavorNotes || 3)
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

