import React from "react"
import { colord } from 'colord';

export default function Star(props: {
    filled: boolean
    width?: number
    height?: number
    color?: string
}) {
    const width = props.width ?? 24;
    const height = props.height ?? 24;
    const color = props.color ?? "#000";
    const [displayedColor, setDisplayedColor] = React.useState(color);
    const [hovered, setHovered] = React.useState(false);

    return (
        <div onMouseEnter={() => {
            setDisplayedColor(colord(color).alpha(0.5).toHex())
            setHovered(true);
        }}
             onMouseLeave={() => {
                 setDisplayedColor(color)
                 setHovered(false);
             }}
        >
            <svg id={props.filled ? "Star_Filled" : "Star_Outlined"} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 16" width={width} height={height}>
                <defs>
                    <style>{`
                        .st${props.filled ? "0" : "1"} {
                        fill: ${props.filled ? displayedColor : "none"};
                        stroke: ${displayedColor};
                        stroke-miterlimit: 10;
                        stroke-width: .5px;
                    }`}
                    </style>
                </defs>
                {/*className={`st${props.filled ? "0" : "1"}`}*/}
                <path
                    style={{
                        fill: props.filled || hovered ? displayedColor : "none",
                        stroke: displayedColor,
                        strokeMiterlimit: 10,
                        strokeWidth: 0.5,
                    }}
                      d="M3.5,9.8L.6,7.4c-.4-.3-.5-.8-.4-1.3.2-.5.6-.8,1.1-.8l3.7-.2.5-.4,1.4-3.4c.2-.5.6-.8,1.1-.8.5,0,.9.3,1.1.8h0s1.4,3.4,1.4,3.4l.5.4,3.7.2c.5,0,.9.4,1.1.8.2.5,0,1-.4,1.3l-2.9,2.4-.2.6.9,3.6c.2.7-.2,1.3-.9,1.5-.3,0-.7,0-.9-.1l-3.1-2h-.6l-3.1,2c-.4.3-1,.2-1.4,0-.4-.3-.6-.8-.5-1.3l.9-3.6-.2-.6Z"
                />
            </svg>
        </div>
    )
}