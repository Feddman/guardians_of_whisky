'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'

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
  revealed: boolean
  pointsBreakdown?: PointsBreakdown[]
}

interface Participant {
  id: string
  name: string
  avatar?: string
}

interface LeaderboardProps {
  whiskies: Whisky[]
  participants: Participant[]
  onClose?: () => void
}

interface ParticipantScore {
  participant: Participant
  totalPoints: number
}

export default function Leaderboard({ whiskies, participants, onClose }: LeaderboardProps) {
  // Calculate points per participant
  const calculateParticipantScores = (): ParticipantScore[] => {
    const scores = new Map<string, { participant: Participant; totalPoints: number }>()
    
    // Initialize all participants with 0 points
    participants.forEach(p => {
      scores.set(p.id, { participant: p, totalPoints: 0 })
    })
    
    // Go through all revealed whiskies and calculate points
    whiskies
      .filter(w => w.revealed && w.pointsBreakdown)
      .forEach(whisky => {
        whisky.pointsBreakdown?.forEach(breakdown => {
          if (breakdown.matchedParticipants && breakdown.matchedParticipants.length > 0) {
            // Points are distributed equally among matched participants
            const pointsPerParticipant = breakdown.points / breakdown.matchedParticipants.length
            
            breakdown.matchedParticipants.forEach(participantName => {
              // Find participant by name
              const participant = participants.find(p => p.name === participantName)
              if (participant) {
                const currentScore = scores.get(participant.id) || { participant, totalPoints: 0 }
                scores.set(participant.id, {
                  ...currentScore,
                  totalPoints: currentScore.totalPoints + pointsPerParticipant
                })
              }
            })
          }
        })
      })
    
    return Array.from(scores.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map(item => ({ participant: item.participant, totalPoints: Math.round(item.totalPoints * 10) / 10 }))
  }
  
  const participantScores = calculateParticipantScores()
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />
      case 1:
        return <Medal className="text-gray-400" size={24} />
      case 2:
        return <Medal className="text-amber-600" size={24} />
      default:
        return <span className="text-gray-400 font-bold text-lg w-6 text-center">{index + 1}</span>
    }
  }
  
  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300'
      default:
        return 'bg-white border-gray-200'
    }
  }
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-4 border-amber-400"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Trophy className="text-amber-500" size={48} />
            <h2 className="text-3xl font-bold text-whisky-dark">Leaderboard</h2>
          </motion.div>
        </div>
        
        {participantScores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nog geen punten behaald. Wacht tot whiskies zijn onthuld!
          </div>
        ) : (
          <div className="space-y-3">
            {participantScores.map((score, index) => (
              <motion.div
                key={score.participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 ${getRankColor(index)}`}
              >
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-shrink-0">
                  {score.participant.avatar ? (
                    <img
                      src={score.participant.avatar}
                      alt={score.participant.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-whisky-light flex items-center justify-center text-whisky-dark font-bold text-lg border-2 border-white shadow-md">
                      {score.participant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold text-lg text-whisky-dark">
                    {score.participant.name}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-whisky-dark">
                    {score.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">punten</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {onClose && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-whisky-dark text-white rounded-lg hover:bg-whisky transition-colors"
            >
              Sluiten
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

