'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Trophy, ArrowRight } from 'lucide-react'

interface Whisky {
  id: string
  name: string
  revealed: boolean
  ratings: any[]
}

interface Session {
  id: string
  code?: string
  date: string
  location: string
  whiskies: Whisky[]
  totalPoints: number
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data.sort((a: Session, b: Session) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ))
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching sessions:', err)
        setLoading(false)
      })
  }, [])

  const calculateAverageRating = (whisky: Whisky) => {
    if (!whisky.ratings || whisky.ratings.length === 0) return 0
    const sum = whisky.ratings.reduce((acc, r) => acc + (r.overall || 0), 0)
    return (sum / whisky.ratings.length).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-xl">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-whisky-dark hover:text-whisky mb-4"
          >
            <ArrowRight size={20} className="rotate-180" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-whisky-dark">Tasting History</h1>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-xl mb-2">No sessions yet</p>
            <p>Start your first tasting session to see history here!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/session/${session.code || session.id}`}
                className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-whisky-dark mb-2">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{session.whiskies.length} whisky{session.whiskies.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-2">
                    <Trophy className="text-whisky" size={24} />
                    <span className="text-2xl font-bold text-whisky-dark">
                      {session.totalPoints || 0}
                    </span>
                    <span className="text-gray-600">points</span>
                  </div>
                </div>

                {session.whiskies.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Whiskies Tasted:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {session.whiskies.map(whisky => (
                        <div
                          key={whisky.id}
                          className="bg-amber-50 rounded-lg p-3 border border-whisky-light"
                        >
                          <div className="font-semibold text-whisky-dark mb-1">
                            {whisky.revealed ? whisky.name : 'Unknown Whisky'}
                          </div>
                          {whisky.ratings && whisky.ratings.length > 0 && (
                            <div className="text-sm text-gray-600">
                              Avg: {calculateAverageRating(whisky)} ⭐
                              {' • '}
                              {whisky.ratings.length} rating{whisky.ratings.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

