import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import { getRandomQuote } from '@/data/joanQuotes'

interface JoanQuoteProps {
  category?: keyof typeof import('@/data/joanQuotes').joanQuotes
  className?: string
}

export default function JoanQuote({ category = 'welcome', className = '' }: JoanQuoteProps) {
  const quote = getRandomQuote(category)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className={`flex items-start gap-3 p-4 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 ${className}`}
    >
      <Scale className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
      <p className="text-sm text-accent-700 dark:text-accent-300 italic leading-relaxed">
        "{quote}"
      </p>
    </motion.div>
  )
}
