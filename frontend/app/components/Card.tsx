interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  glowing?: boolean
}

export default function Card({ title, children, className = "", icon, glowing = false }: CardProps) {
  return (
    <div className={`
      glass-morphism rounded-2xl p-6 
      hover:bg-white/20 transition-all duration-500 
      hover:scale-105 hover:shadow-2xl
      ${glowing ? 'pulse-glow' : ''}
      ${className}
    `}>
      <div className="flex items-center space-x-3 mb-6">
        {icon && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur-md opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg text-white">
              {icon}
            </div>
          </div>
        )}
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="text-gray-100">
        {children}
      </div>
    </div>
  )
}
