'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Award, ChevronDown, ChevronUp, Users, Medal } from 'lucide-react'

interface PointsBreakdown {
  category: string
  value: string
  matches: number
  points: number
  matchedParticipants?: string[]
}

interface WhiskyScore {
  id: string
  name: string
  points: number
  pointsBreakdown?: PointsBreakdown[]
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

interface ScoreboardProps {
  whisky: WhiskyScore
  totalPoints: number
  whiskies?: Whisky[]
  participants?: Participant[]
  onClose?: () => void
}

export default function Scoreboard({ whisky, totalPoints, whiskies = [], participants = [], onClose }: ScoreboardProps) {
  const [showPlayerScores, setShowPlayerScores] = useState(false)

  // Calculate participant scores from all revealed whiskies
  const calculateParticipantScores = () => {
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

  // If no participant has any points yet, hide standings/badges
  const hasAnyPoints = participantScores.some(s => (s.totalPoints || 0) > 0)
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={20} />
      case 1:
        return <Medal className="text-gray-400" size={20} />
      case 2:
        return <Medal className="text-amber-600" size={20} />
      default:
        return <span className="text-gray-400 font-bold text-sm w-5 text-center">{index + 1}</span>
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
          <h2 className="text-3xl font-bold text-whisky-dark">Scorebord</h2>
        </motion.div>
        
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">Punten voor deze whisky</div>
          <div className="text-4xl font-bold text-whisky-dark">{whisky.points || 0}</div>
        </div>
        
        <div className="bg-whisky-light rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Totaal Sessie Punten</div>
          <div className="text-3xl font-bold text-whisky-dark">{totalPoints}</div>
        </div>
      </div>

      {whisky.pointsBreakdown && whisky.pointsBreakdown.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Award size={20} className="text-whisky" />
            Puntenoverzicht
          </h3>
          <div className="space-y-2">
            {whisky.pointsBreakdown.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
              >
                <div>
                  <span className="font-semibold text-whisky-dark">{item.category}:</span>{' '}
                  <span className="text-gray-700">{item.value}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {item.matches} {item.matches === 1 ? 'persoon' : 'personen'} matchten
                    {item.matchedParticipants && item.matchedParticipants.length > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({item.matchedParticipants.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-whisky-dark">+{item.points} ptn</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Player Scores Section */}
      {participants.length > 0 && whiskies.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <button
            onClick={() => setShowPlayerScores(!showPlayerScores)}
            className="w-full flex items-center justify-between p-3 bg-whisky-light rounded-lg hover:bg-whisky-light/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={20} className="text-whisky-dark" />
              <h3 className="font-semibold text-lg text-whisky-dark">Spelers Scorebord</h3>
            </div>
            {showPlayerScores ? (
              <ChevronUp size={20} className="text-whisky-dark" />
            ) : (
              <ChevronDown size={20} className="text-whisky-dark" />
            )}
          </button>
          
          {showPlayerScores && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3"
            >
              {!hasAnyPoints ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Nog geen punten behaald. Wacht tot whiskies zijn onthuld!
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Top 3 - Podium Style */}
                  {participantScores.slice(0, 3).length > 0 && (
                    <div className="flex items-end justify-center gap-2 mb-4 pb-4 border-b-2 border-whisky-light">
                      {/* 2nd Place */}
                      {participantScores[1] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="relative">
                            {participantScores[1].participant.avatar ? (
                              <img
                                src={participantScores[1].participant.avatar}
                                alt={participantScores[1].participant.name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-gray-300 shadow-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl border-4 border-gray-300 shadow-lg">
                                {participantScores[1].participant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {hasAnyPoints && (
                              <div className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                                2
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-700 text-sm">
                              {participantScores[1].participant.name}
                            </div>
                            <div className="text-lg font-bold text-gray-600">
                              {participantScores[1].totalPoints}
                            </div>
                          </div>
                          <div className="w-20 h-12 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg"></div>
                        </motion.div>
                      )}
                      
                      {/* 1st Place */}
                      {participantScores[0] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="relative">
                            {participantScores[0].participant.avatar ? (
                              <img
                                src={participantScores[0].participant.avatar}
                                alt={participantScores[0].participant.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-200"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-2xl border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-200">
                                {participantScores[0].participant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {hasAnyPoints && (
                              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">
                                👑
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-yellow-700">
                              {participantScores[0].participant.name}
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {participantScores[0].totalPoints}
                            </div>
                          </div>
                          <div className="w-24 h-16 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg"></div>
                        </motion.div>
                      )}
                      
                      {/* 3rd Place */}
                      {participantScores[2] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="relative">
                            {participantScores[2].participant.avatar ? (
                              <img
                                src={participantScores[2].participant.avatar}
                                alt={participantScores[2].participant.name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-amber-600 shadow-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-amber-900 font-bold text-xl border-4 border-amber-600 shadow-lg">
                                {participantScores[2].participant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {hasAnyPoints && (
                              <div className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                                3
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-amber-700 text-sm">
                              {participantScores[2].participant.name}
                            </div>
                            <div className="text-lg font-bold text-amber-600">
                              {participantScores[2].totalPoints}
                            </div>
                          </div>
                          <div className="w-20 h-10 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg"></div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* Rest of participants */}
                  {participantScores.slice(3).length > 0 && (
                    <div className="space-y-2">
                      {participantScores.slice(3).map((score, index) => (
                        <motion.div
                          key={score.participant.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          {hasAnyPoints && (
                            <div className="flex items-center justify-center w-8 text-gray-400 font-bold text-sm">
                              {index + 4}
                            </div>
                          )}
                          
                          <div className="flex-shrink-0">
                            {score.participant.avatar ? (
                              <img
                                src={score.participant.avatar}
                                alt={score.participant.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-whisky-light flex items-center justify-center text-whisky-dark font-bold text-sm border-2 border-gray-300 shadow-sm">
                                {score.participant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-semibold text-whisky-dark">
                              {score.participant.name}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-whisky-dark">
                              {score.totalPoints}
                            </div>
                            <div className="text-xs text-gray-500">punten</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {onClose && (
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-whisky-dark text-white rounded-lg hover:bg-whisky transition-colors"
          >
            Doorgaan
          </button>
        </div>
      )}
      </motion.div>
    </div>
  )
}

