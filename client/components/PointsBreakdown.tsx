'use client'

import { Trophy } from 'lucide-react'

interface PointsBreakdownItem {
  category: string
  value: string
  matches: number
  points: number
  matchedParticipants?: string[]
}

interface PointsBreakdownProps {
  totalPoints: number
  breakdown: PointsBreakdownItem[]
}

export default function PointsBreakdown({ totalPoints, breakdown }: PointsBreakdownProps) {
  if (totalPoints === 0) {
    return null
  }

  return (
    <div className="bg-amber-50 border-2 border-whisky-light rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="text-whisky" size={20} />
        <h3 className="font-semibold text-whisky-dark">Puntenoverzicht</h3>
        <span className="ml-auto text-lg font-bold text-whisky-dark">
          {totalPoints} punten
        </span>
      </div>
      <div className="space-y-2">
        {breakdown.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
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
  )
}

