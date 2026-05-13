import type {AnchorHTMLAttributes, DetailedHTMLProps} from "react";
import React from "react";
import './LinkNewTab.css'

export default function LinkNewTab(props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) {
    const {children, ...rest} = props;
    return (
        <a className={"linkWithIcon"} {...rest}>{children}
            <span className={"icon"}
                  style={{mask: `url(open-in-new.svg) center no-repeat`}}
            />
        </a>
    )
}