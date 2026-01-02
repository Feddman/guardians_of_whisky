'use client'

import { motion } from 'framer-motion'
import { Trophy, Users } from 'lucide-react'

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
}

interface WhiskyRevealProps {
  whisky: Whisky
}

export default function WhiskyReveal({ whisky }: WhiskyRevealProps) {
  // Find matching ratings for gamification
  const findMatches = () => {
    const matches: { category: string; value: string; count: number; participants: string[] }[] = []
    
    if (whisky.ratings.length < 2) return matches

    // Check color matches
    const colorCounts: Record<string, number> = {}
    const colorParticipants: Record<string, string[]> = {}
    whisky.ratings.forEach(r => {
      if (r.color) {
        colorCounts[r.color] = (colorCounts[r.color] || 0) + 1
        if (!colorParticipants[r.color]) {
          colorParticipants[r.color] = []
        }
        colorParticipants[r.color].push(r.participantName || 'Anonymous')
      }
    })
    Object.entries(colorCounts).forEach(([color, count]) => {
      if (count > 1) {
        matches.push({ category: 'Kleur', value: color, count, participants: colorParticipants[color] || [] })
      }
    })

    // Check overall rating matches
    const overallCounts: Record<number, number> = {}
    const overallParticipants: Record<number, string[]> = {}
    whisky.ratings.forEach(r => {
      if (r.overall) {
        overallCounts[r.overall] = (overallCounts[r.overall] || 0) + 1
        if (!overallParticipants[r.overall]) {
          overallParticipants[r.overall] = []
        }
        overallParticipants[r.overall].push(r.participantName || 'Anonymous')
      }
    })
    Object.entries(overallCounts).forEach(([rating, count]) => {
      if (count > 1) {
        matches.push({ category: 'Overall Rating', value: `${rating} stars`, count, participants: overallParticipants[parseInt(rating)] || [] })
      }
    })

    // Check flavor note matches
    const noteCounts: Record<string, number> = {}
    const noteParticipants: Record<string, string[]> = {}
    whisky.ratings.forEach(r => {
      r.flavorNotes?.forEach(note => {
        noteCounts[note] = (noteCounts[note] || 0) + 1
        if (!noteParticipants[note]) {
          noteParticipants[note] = []
        }
        if (!noteParticipants[note].includes(r.participantName || 'Anonymous')) {
          noteParticipants[note].push(r.participantName || 'Anonymous')
        }
      })
    })
    Object.entries(noteCounts).forEach(([note, count]) => {
      if (count > 1) {
        matches.push({ category: 'Smaakbeleving', value: note, count, participants: noteParticipants[note] || [] })
      }
    })

    return matches
  }

  const matches = findMatches()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
          {whisky.image && (
            <motion.img
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              src={whisky.image}
              alt={whisky.name}
              className="w-32 h-32 object-cover rounded-lg shadow-lg border-4 border-whisky-light"
            />
          )}
          <div className="flex-1">
            <motion.h2
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-4xl font-bold text-whisky-dark mb-2"
            >
              {whisky.name}
            </motion.h2>
            <div className="flex flex-wrap items-center justify-center gap-3 text-gray-600 mb-2">
              {whisky.years && (
                <span className="px-3 py-1 bg-whisky-light rounded-full text-sm font-semibold">
                  {whisky.years} jaar
                </span>
              )}
              {whisky.type && (
                <span className="px-3 py-1 bg-whisky-light rounded-full text-sm">
                  {whisky.type}
                </span>
              )}
              {whisky.region && (
                <span className="px-3 py-1 bg-whisky-light rounded-full text-sm">
                  {whisky.region}
                </span>
              )}
            </div>
            {whisky.description && (
              <p className="text-gray-600 text-sm max-w-md mx-auto italic mb-2">
                {whisky.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Users size={20} />
              <span>{whisky.ratings.length} beoordeling{whisky.ratings.length !== 1 ? 'en' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="bg-amber-50 border-2 border-whisky-light rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="text-whisky" size={24} />
            <h3 className="font-semibold text-lg">Team Matches!</h3>
          </div>
          <div className="space-y-2">
            {matches.map((match, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-semibold">{match.category}:</span> {match.value} 
                <span className="text-whisky-dark ml-2">
                  ({match.count} {match.count === 1 ? 'persoon' : 'personen'} matchten
                  {match.participants && match.participants.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      : {match.participants.join(', ')}
                    </span>
                  )}
                  )
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Alle Beoordelingen</h3>
        {whisky.ratings.map((rating, idx) => (
          <motion.div
            key={rating.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="border-l-4 border-whisky-light pl-4 py-2"
          >
            <div className="font-semibold mb-2">{rating.participantName}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {rating.color && (
                <div>
                  <span className="font-medium">Kleur:</span> {rating.color}
                </div>
              )}
              {rating.overall && (
                <div>
                  <span className="font-medium">Algemeen:</span> {'⭐'.repeat(rating.overall)}
                </div>
              )}
            </div>
            {rating.flavorNotes && rating.flavorNotes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {rating.flavorNotes.map(note => (
                  <span
                    key={note}
                    className="px-2 py-1 bg-whisky-light rounded-full text-xs"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

