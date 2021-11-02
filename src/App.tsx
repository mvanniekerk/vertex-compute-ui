import { Console } from './Console';
import React from 'react';
import './App.css';
import { GraphView } from './Graph';
import { InfoBar } from './InfoBar';
import { Graph, LogMessage } from './Types';

const HOST = "http://localhost:8080";

type State = Graph & {
  selectedVertex: string | undefined,
  log: LogMessage[],
}

class App extends React.Component<{}, State> {

  private ws?: WebSocket = undefined;

  constructor(props: {}) {
    super(props);
    this.state = {
      vertices: {},
      edges: [],
      selectedVertex: undefined,
      log: [],
    };
  }

  componentDidMount() {
    this.ws = new WebSocket("ws://localhost:8080/ws");
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "log") {
        const logMessage = msg.content;
        const logMessages = this.state.log;
        logMessages.push(logMessage);
        this.setState({ log: logMessages });
      } else if (msg.type === "metrics") {
        // console.log(msg.content);
      }
    };
    fetch(HOST + "/state")
      .then(response => response.json())
      .then(body => {
        const vertices: any = {};
        for (const vertex of body.vertices) {
          vertices[vertex.id] = { ...vertex, x: 100, y: 100 };
        }
        this.setState({ vertices: vertices, edges: body.edges });
      })
  }

  save() {
    fetch(HOST + "/state")
      .then(response => response.text())
      .then(body => {
        const element = document.createElement("a");
        const file = new Blob([body], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "graph.json";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
      })
  }

  load(event: any) {
    const file: File = event.target.files[0];
    const fr = new FileReader();
    fr.onload = (evt: any) => {
      fetch(HOST + "/load", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: evt.target.result,
      })
        .then(response => response.json())
        .then(body => {
          const vertices: any = {};
          for (const vertex of body.vertices) {
            vertices[vertex.id] = { ...vertex, x: 100, y: 100 };
          }
          this.setState({ vertices: vertices, edges: body.edges });
        })
    }
    fr.readAsText(file);
  }

  addVertex() {
    const code = "NumberSource";
    fetch(HOST + "/createvertex", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: null, code: code }),
    })
      .then(response => response.json())
      .then(body => {
        const description = body.description;
        if (description.id) {
          const vertices = { ...this.state.vertices };
          vertices[description.id] = { ...description, x: 100, y: 100 };
          this.setState({ vertices: vertices });
        }
      })
  }

  addEdge(from: string, to: string) {
    fetch(HOST + "/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ source: from, target: to })
    })
      .then(response => response.json())
      .then(body => {
        const edges = this.state.edges.slice();
        edges.push({ from: from, to: to, id: body.id });
        this.setState({ edges: edges });
      })
  }

  changeName(newName: string) {
    const id = this.state.selectedVertex;
    fetch(HOST + "/name/" + id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: newName })
    }).then(response => response.json())
      .then(vertex => {
        const vertices = { ...this.state.vertices };
        const old = vertices[vertex.id];
        vertices[vertex.id] = { ...old, ...vertex };
        this.setState({ vertices: vertices });
      })
  }

  changeCode(newCode: string) {
    const id = this.state.selectedVertex;
    fetch(HOST + "/code/" + id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: newCode })
    })
      .then(response => response.json())
      .then(vertex => {
        const vertices = { ...this.state.vertices };
        const old = vertices[vertex.id];
        vertices[vertex.id] = { ...old, ...vertex };
        this.setState({ vertices: vertices, log: [] });
      })
  }

  selectVertex(id: string) {
    if (this.state.selectedVertex && (this.state.selectedVertex === id)) {
      return;
    }
    this.setState({ selectedVertex: id, log: [] });
    this.ws?.send(id);
  }

  getVertex(id: string | undefined) {
    if (!id) {
      return;
    }
    return this.state.vertices[id];
  }

  render() {
    return (
      <div className="App">
        <GraphView
          vertices={this.state.vertices}
          edges={this.state.edges}
          clickedVertex={this.state.selectedVertex}
          onVertexSelect={id => this.selectVertex(id)}
          move={vertices => this.setState({ vertices: vertices })}
          addEdge={(from, to) => this.addEdge(from, to)} />
        <div className="console">
          <Console log={this.state.log} />
        </div>
        <div className="infobar">
          <div>
            <div className="title">
              <h2>Vertex Info</h2>
            </div>
            <InfoBar
              vertex={this.getVertex(this.state.selectedVertex)}
              changeName={(newName: string) => this.changeName(newName)}
              changeCode={(newCode: string) => this.changeCode(newCode)} />
          </div>
          <div className="new-vertex">
            <button id="new-vertex" onClick={() => this.addVertex()}>New Vertex</button>
            <button id="safe" onClick={() => this.save()}>Save</button>
            <input type="file" id="load" onChange={event => this.load(event)} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;