import { Console } from './Console';
import React from 'react';
import './App.css';
import { GraphView } from './Graph';
import { InfoBar } from './InfoBar';
import { Graph, LogMessage, Vertices, Vertex } from './Types';

const HOST = "http://localhost:8080";

/*
  /graph - GET the graph
  /graph - POST load a graph

  /graph/vertex - POST create a vertex (returns ID)
  /graph/vertex/{id} - DELETE a vertex
  /graph/vertex/{id}/code - POST update the source code
  /graph/vertex/{id}/name - POST update the name
  /graph/edge - POST create an edge

  /send/{name} - POST a message to a vertex
  /sendws - open a WS connection for sending messages directly to vertices
  /ws - open a WS connection for subscribing to log messages and metrics
*/

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
        const content : Record<string, {msgFreqPerSec : number}> = msg.content.metricsByVertexId;
        const vertices = {...this.state.vertices};
        for (const vertex in content) {
          const mps = content[vertex].msgFreqPerSec;
          if (vertex in vertices) {
            vertices[vertex].mps = mps;
          }
        }
        this.setState({ vertices : vertices });
      }
    };
    fetch(HOST + "/graph")
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
    fetch(HOST + "/graph")
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
      fetch(HOST + "/graph", {
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
          this.format();
        })
    }
    fr.readAsText(file);
  }

  addVertex() {
    const code = "Logger";
    fetch(HOST + "/graph/vertex", {
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
    fetch(`${HOST}/graph/edge`, {
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
    fetch(`${HOST}/graph/vertex/${id}/name`, {
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
    fetch(`${HOST}/graph/vertex/${id}/code`, {
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

  delete() {
    const id = this.state.selectedVertex;
    if (!id) {
      return;
    }
    fetch(`${HOST}/graph/vertex/${id}`, {
      method: "DELETE"
    })
      .then(response => {
        if (response.ok) {
          const vertices = {...this.state.vertices};
          delete vertices[id];
          const edges = this.state.edges.filter(edge => edge.from !== id && edge.to !== id);
          this.setState({ vertices : vertices, edges : edges });
        }
      })
  }

  format() {
    const vertices = this.state.vertices;
    const edges = Array.from(this.state.edges);
    const result : Vertex[][] = [];

    const vNames = Object.keys(vertices);
    const noIncomingEdges = new Set(vNames);
    for (const edge of edges) {
      noIncomingEdges.delete(edge.to);
    }

    while (noIncomingEdges.size !== 0) {
      const noIncomingArray = new Set(noIncomingEdges);
      noIncomingEdges.clear();
      result.push(Object.values(vertices).filter(vertex => noIncomingArray.has(vertex.id)));
      for (const vertex of Array.from(noIncomingArray)) {
        for (let i = edges.length - 1; i >= 0; i--) {
          if (edges[i].from === vertex) {
            const to = edges[i].to
            edges.splice(i, 1);
            const incoming = edges.filter(edge => to === edge.to);
            if (incoming.length === 0) {
              noIncomingEdges.add(to);
            }
          }
        }
      }
    }

    const newVertices : Vertices = {};
    let x = 100;
    for (const column of result) {
      column.sort((a, b) => a.name.localeCompare(b.name));
      let y = 100;
      for (const vertex of column) {
        newVertices[vertex.id] = {...vertex, x, y};
        y += 100;
      }
      x += 250;
    }

    this.setState({ vertices : newVertices });
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
          <div className="control">
            <button className="new-vertex" onClick={() => this.addVertex()}>New Vertex</button>
            <button id="safe" onClick={() => this.save()}>Save</button>
            <input type="file" id="load" onChange={event => this.load(event)} accept=".json" />
            <button onClick={() => this.format()}>Format</button>
            <button onClick={() => this.delete()}>Delete</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;