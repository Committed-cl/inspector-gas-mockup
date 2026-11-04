import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function CenteredMessage({ text, linkTo, linkLabel }: { text: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-base">
      <div className="text-center">
        <p className="text-ink font-semibold">{text}</p>
        {linkTo && (
          <Link to={linkTo} className="text-brand text-[13px] mt-2 inline-flex items-center gap-1">
            <Icon name="arrow-left" size={14} />
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
