import { UserRole, type UserRoleValue } from '../types'

const ROLE_STYLES: Record<string, string> = {
  [UserRole.ADMIN]:          'bg-purple-100 text-purple-700',
  [UserRole.BUSINESS_OWNER]: 'bg-green-100  text-green-700',
  [UserRole.CUSTOMER]:       'bg-gray-100   text-gray-600',
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]:          'Admin',
  [UserRole.BUSINESS_OWNER]: 'Business Owner',
  [UserRole.CUSTOMER]:       'Customer',
}

interface Props {
  role: UserRoleValue
}

export default function RoleBadge({ role }: Props) {
  const style = ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600'
  const label = ROLE_LABELS[role] ?? role

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
