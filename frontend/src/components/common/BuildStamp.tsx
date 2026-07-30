import { BUILD_NUMBER, BUILD_TIMESTAMP } from '../../utils/build'

/**
 * Shows which build is running. Rendered in the Topbar (present on every view)
 * and on the PIN screen, so it is visible from every screen in the app.
 */
export default function BuildStamp({ centered = false }: { centered?: boolean }) {
  return (
    <span
      title={BUILD_TIMESTAMP ? `Build ${BUILD_TIMESTAMP}` : 'Unbuilt development bundle'}
      className="font-mono flex-shrink-0"
      style={{
        fontSize: 10,
        color: 'var(--text-3)',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        textAlign: centered ? 'center' : undefined,
      }}
    >
      Build {BUILD_NUMBER}
    </span>
  )
}
