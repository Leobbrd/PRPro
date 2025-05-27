import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'flushed'
  isRequired?: boolean
  isInvalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    size = 'md',
    variant = 'default',
    isRequired = false,
    isInvalid = false,
    className,
    ...props
  }, ref) => {
    const id = props.id || props.name
    const hasError = error || isInvalid

    const baseClasses = [
      'block w-full transition-colors duration-200',
      'placeholder:text-gray-400',
      'focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50'
    ]

    const variantClasses = {
      default: [
        'border border-gray-300 rounded-lg shadow-sm bg-white',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      ],
      filled: [
        'border-0 rounded-lg bg-gray-100',
        'focus:bg-white focus:ring-2 focus:ring-blue-500/20',
        hasError && 'bg-red-50 focus:ring-red-500/20'
      ],
      flushed: [
        'border-0 border-b-2 border-gray-200 rounded-none bg-transparent',
        'focus:border-blue-500',
        hasError && 'border-red-300 focus:border-red-500'
      ]
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const paddingWithIcons = {
      sm: {
        left: leftIcon ? 'pl-10' : '',
        right: rightIcon ? 'pr-10' : '',
      },
      md: {
        left: leftIcon ? 'pl-12' : '',
        right: rightIcon ? 'pr-12' : '',
      },
      lg: {
        left: leftIcon ? 'pl-14' : '',
        right: rightIcon ? 'pr-14' : '',
      },
    }

    return (
      <div className="flex flex-col space-y-1.5">
        {label && (
          <label 
            htmlFor={id} 
            className={clsx(
              'text-sm font-medium text-gray-700',
              isRequired && "after:content-['*'] after:text-red-500 after:ml-1"
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={clsx(
              'absolute inset-y-0 left-0 flex items-center pointer-events-none',
              size === 'sm' ? 'pl-3' : size === 'md' ? 'pl-4' : 'pl-4'
            )}>
              <div className={clsx(
                'text-gray-400',
                iconSizeClasses[size]
              )}>
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={id}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              sizeClasses[size],
              paddingWithIcons[size].left,
              paddingWithIcons[size].right,
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : helper ? `${id}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className={clsx(
              'absolute inset-y-0 right-0 flex items-center pointer-events-none',
              size === 'sm' ? 'pr-3' : size === 'md' ? 'pr-4' : 'pr-4'
            )}>
              <div className={clsx(
                'text-gray-400',
                iconSizeClasses[size]
              )}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600 flex items-start gap-1">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        
        {helper && !error && (
          <p id={`${id}-helper`} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'