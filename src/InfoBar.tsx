import React, { ChangeEvent, FormEvent } from "react";

export class InfoBar extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.state = {
      editName: false,
      editCode: false,
    }
  }

  render() {
    const vertex = this.props.vertex
    if (vertex) {
      return <div className="vertex-info">
        <div className="info-field">
          <label>id</label>
          <p className="content edit">{vertex.id}</p>
        </div>
        <InfoField field="name" content={vertex.name} onChange={(name: string) => this.props.changeName(name)} />
        <InfoField field="code" content={vertex.code} onChange={(code: string) => this.props.changeCode(code)} />
      </div>
    }
    return <div className="vertex-info">
      <p>Select a Vertex</p>
    </div>
  }
}

class InfoField extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.state = {
      value: '',
      editing: false,
    }
  }

  handleChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event: FormEvent<HTMLFormElement>) {
    this.props.onChange(this.state.value);
    this.setState({ editing: false, value: '' });
    event.preventDefault();
  }

  handleEdit() {
    this.setState({ editing: true, value: this.props.content });
  }

  render() {
    if (this.state.editing) {
      return (
        <form className="info-field" onSubmit={event => this.handleSubmit(event)}>
          <label>{this.props.field}</label>
          <input autoFocus className="content" type="text" value={this.state.value} onChange={event => this.handleChange(event)}></input>
          <button className="edit">submit</button>
        </form>
      )
    } else {
      return (
        <div className="info-field">
          <label>{this.props.field}</label>
          <p className="content">{this.props.content}</p>
          <button className="edit" onClick={() => this.handleEdit()}>edit</button>
        </div>
      )
    }
  }

}