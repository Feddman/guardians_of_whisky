'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin } from 'lucide-react'

export default function NewSession() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  // Get or create participant ID for creator
  const getCreatorId = () => {
    const storedId = localStorage.getItem('participantId')
    if (storedId) return storedId
    const newId = crypto.randomUUID()
    localStorage.setItem('participantId', newId)
    return newId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)

    try {
      // Create session
      const creatorId = getCreatorId()
      const sessionResponse = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          location,
          creatorId,
        }),
      })

      const session = await sessionResponse.json()

      router.push(`/session/${session.code || session.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-whisky-dark mb-6 text-center">
            Nieuwe Proeverij Sessie
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} />
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={18} />
                  Locatie
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Waar proeven jullie?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-whisky-light rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Let op:</strong> Je kunt whiskies toevoegen aan deze sessie na het aanmaken met de "Whisky Toevoegen" knop.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-whisky-dark text-white py-3 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sessie Aanmaken...' : 'Sessie Aanmaken'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
