import React from 'react';
import './App.css';
import Selector from "./features/emoji/Selector";
import {useSelector} from "react-redux";
import {RootState} from "./app/store";

function App() {
    const displaySelector = useSelector((state: RootState) => state.emoji.display)
  return (
    <div className="App">
        {displaySelector && <Selector/>}
    </div>
  );
}

export default App;
