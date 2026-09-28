import { CoverArt } from '#/shared/components/CoverArt'
import { masterCoverKey } from '#/shared/utils/cover-key'
import type { ArtistDiscographyItem } from '../search.model'

interface DiscographyCardProps {
  item: ArtistDiscographyItem
  artistName: string
  onClick: () => void
  index: number
}

export function DiscographyCard({
  item,
  artistName,
  onClick,
  index,
}: DiscographyCardProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CoverArt
          coverKey={masterCoverKey(item.id)}
          artist={artistName}
          title={item.title}
          thumb={item.thumb || null}
          styles={[]}
          size={48}
          className="rounded-lg shrink-0 overflow-hidden"
        />
        <div className="flex flex-1 items-center justify-between">
          <span className="font-semibold text-(--sea-ink)">{item.title}</span>
          {item.year !== null && (
            <span className="font-mono text-xs text-(--sea-ink-soft) shrink-0">
              {item.year}
            </span>
          )}
        </div>
      </button>
    </li>
  )
}
