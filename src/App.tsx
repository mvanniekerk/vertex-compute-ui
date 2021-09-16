import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="graph"> 
        Graph goes here.
      </div>
      <div className="console"> 
        Console goes here.
      </div>
      <div className="infobar">
        <div className="vertex-info">Vertex Info</div>
        <div className="new-vertex">
          <button id="new-vertex">New Vertex</button>
        </div>
      </div>
    </div>
  );
}

export default App;
