interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export default function Card({ title, children, className = "", icon }: CardProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}
