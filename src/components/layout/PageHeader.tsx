import { useLayoutEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface PathItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  pathItems?: PathItem[]
  title?: string
  actions?: ReactNode
  /** Content for the second bar (left side) — tabs, filters, etc. */
  secondBarLeft?: ReactNode
  /** Content for the second bar (right side) */
  secondBarRight?: ReactNode
  // Legacy compat
  breadcrumb?: ReactNode
  subtitle?: string
}

export default function PageHeader({
  pathItems,
  title,
  actions,
  secondBarLeft,
  secondBarRight,
  breadcrumb,
}: PageHeaderProps) {
  const [slots, setSlots] = useState<{
    breadcrumb: Element | null
    actions: Element | null
    sbLeft: Element | null
    sbRight: Element | null
  }>({ breadcrumb: null, actions: null, sbLeft: null, sbRight: null })

  useLayoutEffect(() => {
    setSlots({
      breadcrumb: document.getElementById('layout-breadcrumb'),
      actions: document.getElementById('layout-top-actions'),
      sbLeft: document.getElementById('layout-sb-left'),
      sbRight: document.getElementById('layout-sb-right'),
    })
  }, [])

  const breadcrumbContent = pathItems ? (
    <>
      {pathItems.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <span className="text-gray-300 select-none">›</span>}
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                'truncate transition-colors',
                i === pathItems.length - 1
                  ? 'font-medium text-gray-900'
                  : 'text-gray-400 hover:text-gray-700',
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'truncate',
                i === pathItems.length - 1 ? 'font-medium text-gray-900' : 'text-gray-400',
              )}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </>
  ) : title ? (
    <span className="font-medium text-gray-900 truncate">{title}</span>
  ) : breadcrumb ? (
    <span className="text-gray-400">{breadcrumb}</span>
  ) : null

  return (
    <>
      {breadcrumbContent && slots.breadcrumb
        ? createPortal(breadcrumbContent, slots.breadcrumb)
        : null}
      {actions && slots.actions ? createPortal(actions, slots.actions) : null}
      {secondBarLeft && slots.sbLeft ? createPortal(secondBarLeft, slots.sbLeft) : null}
      {secondBarRight && slots.sbRight ? createPortal(secondBarRight, slots.sbRight) : null}
    </>
  )
}
