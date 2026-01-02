'use client'

import { motion } from 'framer-motion'
import { Trophy, Award } from 'lucide-react'

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

interface ScoreboardProps {
  whisky: WhiskyScore
  totalPoints: number
  onClose?: () => void
}

export default function Scoreboard({ whisky, totalPoints, onClose }: ScoreboardProps) {
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

