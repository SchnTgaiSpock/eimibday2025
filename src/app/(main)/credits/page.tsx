"use client"

import { messages } from "@/data/messages"
import { scrans } from "@/data/scran"
import { Fragment } from "react"

export default function Credits() {
  return <div style={{ textAlign: "center", margin: "auto" }}>
    <div
      className="paper-wrapper credits"
      onScroll={e => {
        e.stopPropagation()
      }}
    >
      <div
        className="paper"
      >
        <div className="paper-header">
          <div className="paper-background"></div>
          <p></p>
        </div>
        <div className="paper-lines credits">
          <div className="paper-background noise"></div>
          <div>
            <p>
              <strong>Project Management</strong>
            </p>
            <p>
              Terminal Prophet<br />
              MisterYura<br />
              Botch Guy
            </p>
            <p>
              <strong>Development</strong>
            </p>
            <p>
              Schn<br />
              Liquid Skelie<br />
              MisterYura
            </p>
            <div className="row">
              <div className="col">
                <p>
                  <strong>Messages</strong>
                </p>
                <p>
                  {messages.map((m, i) => <Fragment key={m.id}>
                    {m.from}
                    {i !== messages.length - 1 && <br />}
                  </Fragment>)}
                </p>
              </div>
              <div className="col">
                <p>
                  <strong>Scrans</strong>
                </p>
                <p>
                  {
                    (
                      Array.from(
                        new Set(scrans.filter(scran => scran.submittedBy != null).map(scran => scran.submittedBy))
                      ).sort(function (a, b) { return (a?.toLowerCase() ?? '').localeCompare(b?.toLowerCase() ?? '') })
                    ).map((m, i) => <Fragment key={i}>
                      {m !== '' && m}
                      {i !== messages.length - 1 && <br />}
                    </Fragment>)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}