const Logo = ({ className }) => (
  <img
    src='/favicon.png'
    width='30'
    height='30'
    alt='Logo'
    className={className}
    draggable={false}
    onContextMenu={e => e.preventDefault()}
    onTouchStart={e => e.preventDefault()}
  />
)

export default Logo
