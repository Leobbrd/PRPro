import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    ]
    
    const variantClasses = {
      primary: [
        'bg-blue-600 text-white shadow-sm',
        'hover:bg-blue-700 hover:shadow-md',
        'focus:ring-blue-500',
        'active:bg-blue-800'
      ],
      secondary: [
        'bg-gray-100 text-gray-900 shadow-sm border border-gray-200',
        'hover:bg-gray-200 hover:shadow-md',
        'focus:ring-gray-500',
        'active:bg-gray-300'
      ],
      danger: [
        'bg-red-600 text-white shadow-sm',
        'hover:bg-red-700 hover:shadow-md',
        'focus:ring-red-500',
        'active:bg-red-800'
      ],
      outline: [
        'bg-transparent text-blue-600 border-2 border-blue-600',
        'hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700',
        'focus:ring-blue-500',
        'active:bg-blue-100'
      ],
      ghost: [
        'bg-transparent text-gray-600',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:ring-gray-500',
        'active:bg-gray-200'
      ]
    }
    
    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs gap-1',
      sm: 'px-3 py-2 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-3',
    }

    const iconSizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    }

    const isDisabled = loading || disabled

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <LoadingSpinner className={iconSizeClasses[size]} />
        ) : leftIcon ? (
          <span className={iconSizeClasses[size]}>{leftIcon}</span>
        ) : null}
        
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>

        {!loading && rightIcon && (
          <span className={iconSizeClasses[size]}>{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Loading spinner component
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}