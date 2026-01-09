import { forwardRef } from "react"
import { getCountry, getCountryFlagSpaces, getCountryFlagClass, getDescription, getLocation, getName, getPrice, getPercent, getSubmittedBy, getYear, Scran } from "../../../data/scran"
import "flag-icons/css/flag-icons.min.css";

interface ScranDisplayProps {
    scran: Scran
    side: 'left' | 'right'
    isWinner: boolean,
    showPercent?: boolean
    onClick: (isWinner: boolean) => void
}

export function ScranDisplay({
    scran,
    side,
    isWinner,
    showPercent = false,
    onClick
}: ScranDisplayProps) {
    return <div
        className="scran-box"
        style={{
            backgroundImage: `url(${scran.imageUrl})`,
            backgroundSize: scran.backgroundSize ?? 'cover',
            backgroundRepeat: "no-repeat",
            backgroundPosition: scran.backgroundPosition ?? 'center',
        }}
        onClick={() => onClick(isWinner)}
    >
        <div className="scran-percent" style={{
            ...(showPercent ? {color: isWinner ? "green" : "red"} : {color: "white"}),
            fontSize: showPercent ? "2.5rem" : "8rem",
            opacity: showPercent ? 1 : 0
        }}>
            {showPercent && getPercent(scran) + "%"}
        </div>
        <div className="scran-header">{getLocation(scran)}, {getYear(scran)} <span style={{ float: "right" }}>{getCountry(scran)}{getCountryFlagSpaces(scran)}<span className={getCountryFlagClass(scran)}/></span></div>
        <div className="scran-footer" style={{
            display: 'flex',
            flexDirection: side === 'right' ? 'row' : 'row-reverse',
            justifyContent: 'space-between'
        }}>
            <div style={{
                textAlign: side === 'right' ? 'left' : 'right',
            }}>
                <p className="scran-name">{getName(scran)}</p>
                <p>{getDescription(scran)}{getPrice(scran)}</p>
            </div>
            <div className="scran-submitter" style={{
                textAlign: side === 'right' ? 'right' : 'left',
                marginTop: "auto", marginBottom: "auto"
            }}>
                {getSubmittedBy(scran)}
            </div>
        </div>
    </div>
}