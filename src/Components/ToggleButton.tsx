import "./ToggleButton.css"
import * as React from "react";
import type {ChangeEvent} from "react";

export default function ToggleButton({checked, onChange, children} : {checked: boolean, onChange: (event : ChangeEvent) => void, children?: React.ReactNode }) {

    return (
        <label className={"switch"}>
            <input type="checkbox" className={"toggle"} checked={checked} onChange={onChange}/>
            <span className="slider"></span>
            {children}
        </label>
    )
}