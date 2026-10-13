// https://react-svgr.com/playground/

const NotionAvatar = (props) => (
  <div className={props.className} style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%'
  }}>
    <img
      src="/図2.png"
      alt="头像"
      style={{
        maxWidth: '85%',
        height: 'auto'
      }}
      draggable="false"
      onContextMenu={e => e.preventDefault()}
      onTouchStart={e => e.preventDefault()}
    />
  </div>
)

export default NotionAvatar
