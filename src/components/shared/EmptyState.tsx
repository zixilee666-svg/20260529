import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center mb-4">
        {icon || <Scale className="w-8 h-8 text-primary-400" />}
      </div>
      <h3 className="text-lg font-display font-semibold text-primary-700 dark:text-primary-200 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-primary-500 max-w-md mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  )
}
