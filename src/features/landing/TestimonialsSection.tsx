import React from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation()

  const testimonials = [
    {
      name: 'Awa Diop',
      role: t('testimonials.t1Role'),
      location: t('testimonials.t1Location'),
      avatar: 'AD',
      quote: t('testimonials.t1Quote'),
    },
    {
      name: 'Kouassi Marc',
      role: t('testimonials.t2Role'),
      location: t('testimonials.t2Location'),
      avatar: 'KM',
      quote: t('testimonials.t2Quote'),
    },
    {
      name: 'Dr. Samuel Nguema',
      role: t('testimonials.t3Role'),
      location: t('testimonials.t3Location'),
      avatar: 'SN',
      quote: t('testimonials.t3Quote'),
    },
  ]

  return (
    <section id="testimonials" className="py-20 border-t dark:border-white/5 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {t('testimonials.tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight dark:text-white text-gray-900">
            {t('testimonials.title')}
          </h2>
          <p className="text-sm sm:text-base dark:text-gray-400 text-gray-600">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="glass-card card-hover-effect rounded-2xl p-6 border dark:border-white/8 border-gray-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t dark:border-white/5 border-gray-200">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold dark:text-white text-gray-900">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {item.role} • {item.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
