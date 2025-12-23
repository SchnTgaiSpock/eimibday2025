import { hash } from "@/util/hash"
import { Message } from "../../../data/messages"

interface LinePaperProps {
  message: Message
}

export function LinePaper({
  message
}: LinePaperProps) {
  const isVideo = message.imageUrl?.includes("vimeo.com")
  const isYoutube = message.imageUrl?.includes("youtube.com")
  const style = { transform: `rotate(${hash(message.text, 70) / 10 - 4}deg)` }
  // TODO: preload -> medium, 200w_s -> giphy.gif
  return <div
    className="paper-wrapper"
    style={{
      transform: `translateZ(0) rotate(${hash(message.text, 300) / 100 - 1.5}deg)`
    }}
    onScroll={e => {
      e.stopPropagation()
    }}
  >
    <div
      className="paper"
    >
      <div className="paper-header">
        <div className="paper-background"></div>
        <p>From: {message.from}</p>
      </div>
      <div className="paper-lines">
        <div className="paper-background noise"></div>
        <div dangerouslySetInnerHTML={{ __html: message.text }} />
        {!!message.imageUrl && <div className="paper-image" style={style}>
          {isVideo && <video controls><source src={message.imageUrl} type="video/mp4" /></video>}
          {isYoutube && <iframe width="533" height="400" src={message.imageUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>}
          {!isVideo && !isYoutube && <img src={message.imageUrl} />}
        </div>}
      </div>
    </div>
  </div>
} 