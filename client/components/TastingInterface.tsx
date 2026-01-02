'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

interface Rating {
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

interface TastingInterfaceProps {
  sessionId: string
  whiskyId: string
  participantId: string
  participantName: string
  existingRating?: Rating
  maxFlavorNotes?: number
}

interface FlavorCategory {
  id: string
  name: string
  emoji: string
  description: string
  notes: string[]
}

const FLAVOR_CATEGORIES: FlavorCategory[] = [
  {
    id: 'grain-sweet',
    name: 'Graan & Zoet',
    emoji: '🌾',
    description: 'Basis-smaken, vooral uit graan en distillatie',
    notes: ['Mout', 'Honing', 'Vanille', 'Biscuit', 'Karamel', 'Suikerstroop', 'Toffee', 'Bruine suiker', 'Maple syrup', 'Fudge', 'Butterscotch', 'Zoethout']
  },
  {
    id: 'fruity',
    name: 'Fruitig',
    emoji: '🍎',
    description: 'Ontstaat door esters tijdens fermentatie',
    notes: ['Vers fruit', 'Appel', 'Peer', 'Citrus', 'Druif', 'Gedroogd fruit', 'Rozijnen', 'Vijgen', 'Dadels', 'Abrikoos', 'Perzik', 'Pruim', 'Kers', 'Aardbei', 'Framboos', 'Bosbes', 'Sinaasappel', 'Grapefruit', 'Limoen', 'Citroen', 'Mango', 'Ananas', 'Banaan', 'Meloen', 'Kiwi']
  },
  {
    id: 'spicy',
    name: 'Kruidig',
    emoji: '🌶️',
    description: 'Meestal hout- en vatgerelateerd',
    notes: ['Zwarte peper', 'Kaneel', 'Kruidnagel', 'Nootmuskaat', 'Gember', 'Kardemom', 'Anijs', 'Venkel', 'Steranijs', 'Koriander', 'Komijn', 'Paprika', 'Chili']
  },
  {
    id: 'woody-earthy',
    name: 'Hout & Aards',
    emoji: '🪵',
    description: 'Vat, rijping en oxidatie',
    notes: ['Eikenhout', 'Ceder', 'Leer', 'Tabak', 'Notig', 'Droog gras', 'Aarde', 'Mos', 'Paddenstoel', 'Truffel', 'Hooi', 'Stro', 'Houtskool', 'Geroosterd hout', 'Verbrand hout', 'Kurk', 'Mineraal']
  },
  {
    id: 'peaty-smoky',
    name: 'Rokerig',
    emoji: '🔥',
    description: 'Fenolen uit turfrook',
    notes: ['Turf', 'Rook', 'Kampvuur', 'Medicinale tonen', 'Teer', 'Zeezout', 'Sigarettenrook', 'Sigarenrook', 'Geroosterd', 'Gebrand', 'As', 'Bacon', 'Gerookt vlees', 'BBQ', 'Houtvuur', 'Jodium', 'Antiseptisch', 'Fenolisch']
  },
  {
    id: 'floral',
    name: 'Floraal',
    emoji: '🌸',
    description: 'Bloemige en plantachtige tonen',
    notes: ['Bloesem', 'Heide', 'Lavendel', 'Gras', 'Roos', 'Jasmijn', 'Kamille', 'Eucalyptus', 'Munt', 'Basilicum', 'Tijm', 'Rozemarijn', 'Salie', 'Kruiden']
  },
  {
    id: 'nutty-chocolate',
    name: 'Notig & Chocolade',
    emoji: '🍫',
    description: 'Rijke, notige en chocolade tonen',
    notes: ['Amandel', 'Hazelnoot', 'Cacao', 'Walnoot', 'Pecannoot', 'Cashewnoot', 'Pistache', 'Macadamia', 'Kokos', 'Kastanje', 'Geroosterde noten']
  },
  {
    id: 'umami-salty',
    name: 'Umami / Zilt',
    emoji: '🧂',
    description: 'Hartige en zoute tonen',
    notes: ['Zout', 'Bouillon', 'Vleesachtig', 'Soja', 'Miso', 'Umami', 'Sojasaus', 'Anchovis', 'Zeewier', 'Hartig', 'Vlezig']
  },
  {
    id: 'chemical-industrial',
    name: 'Chemisch / Industrieel',
    emoji: '⚗️',
    description: 'Kleine, maar erkende categorie',
    notes: ['Zwavel', 'Rubber', 'Olie', 'Metaal', 'IJzer', 'Koper', 'Petroleum', 'Medicinaal', 'Antiseptisch', 'Jodium', 'Fenol', 'Plastic', 'Synthetisch', 'Industrieel']
  },
  {
    id: 'dairy-creamy',
    name: 'Zuivel & Romig',
    emoji: '🥛',
    description: 'Rijke, romige en zuivelachtige tonen',
    notes: ['Room', 'Boter', 'Crème', 'Yoghurt', 'Kaas', 'Melk', 'Crème brûlée']
  },
  {
    id: 'herbal-tea',
    name: 'Kruidig & Thee',
    emoji: '🍵',
    description: 'Kruidige en theachtige tonen',
    notes: ['Groene thee', 'Zwarte thee', 'Earl Grey', 'Jasmijn thee', 'Kamille thee', 'Munt thee', 'Rooibos', 'Kruidenthee', 'Tijm', 'Rozemarijn', 'Salie', 'Basilicum', 'Koriander']
  },
  {
    id: 'baked-grain',
    name: 'Gebakken & Graan',
    emoji: '🥖',
    description: 'Gebakken en graanachtige tonen',
    notes: ['Brood', 'Biscuit', 'Koekjes', 'Toast', 'Geroosterd brood', 'Gerst', 'Tarwe', 'Rogge', 'Haver', 'Maïs', 'Rijst', 'Geroosterd graan', 'Mout']
  },
  {
    id: 'tropical-exotic',
    name: 'Tropisch & Exotisch',
    emoji: '🌴',
    description: 'Tropische en exotische fruit- en smaaktonen',
    notes: ['Mango', 'Papaja', 'Passievrucht', 'Lychee', 'Guave', 'Kokos', 'Ananas', 'Banaan', 'Tamarinde', 'Yuzu', 'Citroengras']
  }
]

// Flatten all notes for easy lookup
const ALL_FLAVOR_NOTES = FLAVOR_CATEGORIES.flatMap(category => category.notes)

const COLOR_OPTIONS = [
  { name: 'Pale Straw', description: 'Very light yellow', hex: '#F3E5AB' },
  { name: 'Light Gold', description: 'Soft gold', hex: '#E6C87A' },
  { name: 'Gold', description: 'Rich golden', hex: '#D4AF37' },
  { name: 'Amber', description: 'Orange-brown', hex: '#C68642' },
  { name: 'Deep Amber', description: 'Dark amber', hex: '#A97142' },
  { name: 'Copper', description: 'Reddish-brown', hex: '#B87333' },
  { name: 'Mahogany', description: 'Dark red-brown', hex: '#5B2C20' },
  { name: 'Dark Oak / Espresso', description: 'Very dark brown', hex: '#3B1F1B' }
]

export default function TastingInterface({
  sessionId,
  whiskyId,
  participantId,
  participantName,
  existingRating,
  maxFlavorNotes = 3
}: TastingInterfaceProps) {
  const [rating, setRating] = useState<Rating>(existingRating || {
    aromaIntensity: undefined,
    aromaSmokiness: undefined,
    aromaSweetness: undefined,
    color: '',
    flavorNotes: [],
    overall: undefined
  })
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  const totalSteps = 4
  const steps = [
    { number: 1, name: 'Kleur', icon: '🎨' },
    { number: 2, name: 'Aroma', icon: '👃' },
    { number: 3, name: 'Smaakbeleving', icon: '👅' },
    { number: 4, name: 'Beoordeling', icon: '⭐' }
  ]
  
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Kleur
        return !!rating.color
      case 2: // Aroma
        return rating.aromaIntensity !== undefined && 
               rating.aromaSmokiness !== undefined && 
               rating.aromaSweetness !== undefined
      case 3: // Smaakbeleving
        return rating.flavorNotes && rating.flavorNotes.length > 0 && rating.flavorNotes.length <= maxFlavorNotes
      case 4: // Beoordeling
        return rating.overall !== undefined
      default:
        return false
    }
  }
  
  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/sessions/${sessionId}/whisky/${whiskyId}/rate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId,
            participantName,
            ...rating
          })
        }
      )

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
  }

  const toggleFlavorNote = (note: string) => {
    setRating(prev => {
      const currentNotes = prev.flavorNotes || []
      if (currentNotes.includes(note)) {
        // Remove note
        return {
          ...prev,
          flavorNotes: currentNotes.filter(n => n !== note)
        }
      } else {
        // Add note (max based on session setting)
        if (currentNotes.length >= maxFlavorNotes) {
          return prev // Don't add if already at max
        }
        return {
          ...prev,
          flavorNotes: [...currentNotes, note]
        }
      }
    })
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
        <h2 className="text-2xl font-bold mb-2">Beoordeling Verzonden!</h2>
        <p className="text-gray-600">Wachten op anderen...</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-whisky-dark mb-2">
          Beoordeel Deze Whisky
        </h2>
        <div className="text-4xl font-bold text-whisky-dark/50 mb-2">
          ????? 
        </div>
        <p className="text-sm text-gray-500">De whisky naam wordt onthuld na het proeven</p>
      </div>

      {/* Wizard Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                  currentStep === step.number
                    ? 'bg-whisky-dark text-white scale-110'
                    : currentStep > step.number
                    ? 'bg-whisky-light text-whisky-dark'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-1 text-center ${
                  currentStep === step.number ? 'font-semibold text-whisky-dark' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-whisky-dark' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Color */}
        {currentStep === 1 && (
          <div className="border-t-2 border-whisky-light pt-6">
            <h3 className="text-xl font-bold text-whisky-dark mb-4">Kleur</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_OPTIONS.map(color => {
                const isSelected = rating.color === color.name
                return (
                  <button
                    key={color.name}
                    onClick={() => setRating(prev => ({ ...prev, color: color.name }))}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'border-whisky-dark shadow-lg shadow-whisky-dark/30 scale-105'
                        : 'border-gray-300 hover:border-whisky hover:shadow-md'
                    }`}
                  >
                    {/* Color Swatch */}
                    <div 
                      className="h-20 w-full"
                      style={{ backgroundColor: color.hex }}
                    >
                      {/* Gradient overlay for better text visibility on light colors */}
                      {color.name === 'Pale Straw' || color.name === 'Light Gold' ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                      ) : null}
                    </div>
                    
                    {/* Color Info */}
                    <div className={`p-3 text-left ${isSelected ? 'bg-whisky-light' : 'bg-white'}`}>
                      <div className={`font-semibold text-sm ${isSelected ? 'text-whisky-dark' : 'text-gray-800'}`}>
                        {color.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {color.description}
                      </div>
                      <div className="text-xs font-mono text-gray-400 mt-1">
                        {color.hex}
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-whisky-dark text-white rounded-full p-1.5 shadow-lg">
                        <CheckCircle size={16} className="fill-current" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Aroma Section */}
        {currentStep === 2 && (
          <div className="border-t-2 border-whisky-light pt-6">
            <h3 className="text-xl font-bold text-whisky-dark mb-4">Aroma</h3>
            
            {/* Aroma Intensiteit */}
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-3">Intensiteit</label>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setRating(prev => ({ ...prev, aromaIntensity: level }))}
                    className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      rating.aromaIntensity === level
                        ? 'border-whisky-dark bg-whisky-light text-whisky-dark'
                        : 'border-gray-300 hover:border-whisky text-gray-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                <span className="flex flex-col items-center">
                  <span className="text-base">👃</span>
                  <span>"Is er iets?"</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">👃</span>
                  <span>"Oh, daar is 'ie"</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">👃</span>
                  <span>"Ja hoor, duidelijk"</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">💨</span>
                  <span>"Wow, aanwezig!"</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">☠️</span>
                  <span>"Open raam. Nu."</span>
                </span>
              </div>
            </div>

            {/* Aroma Rokerigheid */}
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-3">Rokerigheid</label>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setRating(prev => ({ ...prev, aromaSmokiness: level }))}
                    className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      rating.aromaSmokiness === level
                        ? 'border-whisky-dark bg-whisky-light text-whisky-dark'
                        : 'border-gray-300 hover:border-whisky text-gray-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                <span className="flex flex-col items-center">
                  <span className="text-base">🌱</span>
                  <span>Geen vuur<br/>in zicht</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">🐟</span>
                  <span>Gebakken<br/>zalm</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">🔥</span>
                  <span>Kampvuur</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">🚬</span>
                  <span>Sigarenrook</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">🌋</span>
                  <span>Bosbrand</span>
                </span>
              </div>
            </div>

            {/* Aroma Zoetheid */}
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-3">Zoetheid</label>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setRating(prev => ({ ...prev, aromaSweetness: level }))}
                    className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      rating.aromaSweetness === level
                        ? 'border-whisky-dark bg-whisky-light text-whisky-dark'
                        : 'border-gray-300 hover:border-whisky text-gray-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                <span className="flex flex-col items-center">
                  <span className="text-base">😬</span>
                  <span>Oei, bitter!</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">🙂</span>
                  <span>Net een<br/>randje</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">😌</span>
                  <span>Aangenaam<br/>zoet</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">😋</span>
                  <span>Mmm, lekker<br/>zoet</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-base">😍</span>
                  <span>Zoet feestje</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Flavor Notes */}
        {currentStep === 3 && (
          <div className="border-t-2 border-whisky-light pt-6">
            <h3 className="text-xl font-bold text-whisky-dark mb-4">Smaakbeleving</h3>
            <label className="block text-lg font-semibold mb-3">
              {rating.flavorNotes && rating.flavorNotes.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({rating.flavorNotes.length}/{maxFlavorNotes} geselecteerd)
                </span>
              )}
            </label>
            
            <div className="space-y-4">
              {FLAVOR_CATEGORIES.map(category => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-whisky-dark">{category.name}</h4>
                      <p className="text-xs text-gray-500 italic">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.notes.map(note => {
                      const isSelected = rating.flavorNotes?.includes(note)
                      const isDisabled = !isSelected && (rating.flavorNotes?.length || 0) >= maxFlavorNotes
                      return (
                        <button
                          key={`${category.id}-${note}`}
                          onClick={() => toggleFlavorNote(note)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                            isSelected
                              ? 'border-whisky-dark bg-whisky-light text-whisky-dark font-semibold shadow-sm'
                              : isDisabled
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:border-whisky hover:bg-white'
                          }`}
                        >
                          {note}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {rating.flavorNotes && rating.flavorNotes.length >= maxFlavorNotes && (
              <p className="text-sm text-gray-500 mt-3 text-center">Maximaal {maxFlavorNotes} smaaknotities geselecteerd</p>
            )}
          </div>
        )}

        {/* Step 4: Overall Rating - Stars */}
        {currentStep === 4 && (
          <div className="border-t-2 border-whisky-light pt-6">
            <h3 className="text-xl font-bold text-whisky-dark mb-4">Algemene Beoordeling</h3>
            <label className="block text-lg font-semibold mb-3">Beoordeel deze whisky</label>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(prev => ({ ...prev, overall: star }))}
                    className={`flex-1 text-4xl transition-all ${
                      rating.overall && star <= rating.overall
                        ? 'text-amber-400'
                        : 'text-gray-300 hover:text-amber-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
                {rating.overall && (
                  <span className="ml-2 text-gray-600 text-sm whitespace-nowrap">{rating.overall} / 5</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 text-center">
                <span>Vreselijk,<br/>nooit meer drinken</span>
                <span>Niet mijn<br/>favoriet</span>
                <span>Oké</span>
                <span>Lekker</span>
                <span>Fantastisch!</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6 border-t-2 border-whisky-light">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              ← Vorige
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-whisky-dark text-white py-3 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volgende →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-whisky-dark text-white py-4 rounded-lg font-semibold text-lg hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Beoordeling Verzenden
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

