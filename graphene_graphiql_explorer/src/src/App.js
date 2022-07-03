import React, { Component } from "react";
import GraphiQL from "graphiql";
import { StorageAPI } from '@graphiql/toolkit';
import GraphiQLExplorer from "graphiql-explorer";
import { buildClientSchema, getIntrospectionQuery, parse } from "graphql";

import { makeDefaultArg, getDefaultScalarArgValue } from "./CustomArgs";

import "graphiql/graphiql.css";
import "./App.css";

function fetcher(params, opts) {
  if (typeof opts === 'undefined') {
    opts = {};
  }
  var headers = opts.headers || {};
  headers['Accept'] = headers['Accept'] || 'application/json';
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const url = `//${window.location.host}${window.location.pathname}`;
  return fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(params)
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (responseBody) {
      try {
        return JSON.parse(responseBody);
      } catch (e) {
        return responseBody;
      }
    });
}


const STORAGE_KEYS = {
  SAVE_HEADERS_TEXT: 'saveHeadersText',
  HEADERS_TEXT: 'headersText',
};


const isValidJSON = json => {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
};



class App extends Component {
  _storage = new StorageAPI();

  _graphiql;

  state = {
    schema: null,
    query: '',
    explorerIsOpen: true,
    showHeaderEditor: false,
    saveHeadersText: this._storage.get(STORAGE_KEYS.SAVE_HEADERS_TEXT) === 'true',
    headersText: this._storage.get(STORAGE_KEYS.HEADERS_TEXT) || '{\n"Authorization": null\n}\n',
    headersTextValid: true,
  };



  componentDidMount() {
    fetcher({
      query: getIntrospectionQuery()
    }).then(result => {
      const editor = this._graphiql.getQueryEditor();
      editor.setOption("extraKeys", {
        ...(editor.options.extraKeys || {}),
        "Shift-Alt-LeftClick": this._handleInspectOperation
      });

      this.setState({ schema: buildClientSchema(result.data) });
    });
  }

  _handleInspectOperation = (cm, mousePos) => {
    const parsedQuery = parse(this.state.query || "");

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    var token = cm.getTokenAt(mousePos);
    var start = { line: mousePos.line, ch: token.start };
    var end = { line: mousePos.line, ch: token.end };
    var relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end)
    };

    var position = relevantMousePos;

    var def = parsedQuery.definitions.find(definition => {
      if (!definition.loc) {
        console.log("Missing location information for definition");
        return false;
      }

      const { start, end } = definition.loc;
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(
        "Unable to find definition corresponding to mouse position"
      );
      return null;
    }

    var operationKind =
      def.kind === "OperationDefinition"
        ? def.operation
        : def.kind === "FragmentDefinition"
          ? "fragment"
          : "unknown";

    var operationName =
      def.kind === "OperationDefinition" && !!def.name
        ? def.name.value
        : def.kind === "FragmentDefinition" && !!def.name
          ? def.name.value
          : "unknown";

    var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    var el = document.querySelector(selector);
    el && el.scrollIntoView();
  };



  _handleEditQuery = query => this.setState({ query });

  _handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

  handleToggleSaveHeaders = () => {
    this.setState(
      oldState => ({ saveHeadersText: !oldState.saveHeadersText }),
      () => {
        this._storage.set(
          STORAGE_KEYS.SAVE_HEADERS_TEXT,
          JSON.stringify(this.state.saveHeadersText),
        );
        this._storage.set(
          STORAGE_KEYS.HEADERS_TEXT,
          this.state.saveHeadersText ? this.state.headersText : '',
        );
      },
    );
  };

  handleEditHeaders = headersText => {
    this.setState(
      {
        headersText,
        headersTextValid: isValidJSON(headersText),
      },
      () => {
        if (this.state.headersTextValid && this.state.saveHeadersText) {
          this._storage.set(STORAGE_KEYS.HEADERS_TEXT, this.state.headersText);
        }
        if (this.state.headersTextValid && this.subscriptionsClient) {
          // Reconnect to websocket with new headers
          this.restartSubscriptionsClient();
        }
      },
    );
  };

  render() {
    const { query, schema } = this.state;
    return (
      <div className="graphiql-container">
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={this._handleEditQuery}
          onRunOperation={operationName =>
            this._graphiql.handleRunQuery(operationName)
          }
          explorerIsOpen={this.state.explorerIsOpen}
          onToggleExplorer={this._handleToggleExplorer}
          getDefaultScalarArgValue={getDefaultScalarArgValue}
          makeDefaultArg={makeDefaultArg}
        />
        <GraphiQL
          ref={ref => (this._graphiql = ref)}
          fetcher={fetcher}
          schema={schema}
          query={query}
          onEditQuery={this._handleEditQuery}
          headerEditorEnabled={window.GRAPHENE_SETTINGS.graphiqlHeaderEditorEnabled}
          headers={this.state.headersText}
          onEditHeaders={this.handleEditHeaders}
        >
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              onClick={() => this._graphiql.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
            />
            <GraphiQL.Button
              onClick={() => this._graphiql.handleToggleHistory()}
              label="History"
              title="Show History"
            />
            <GraphiQL.Button
              onClick={this._handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
            <GraphiQL.Button
              label={'Headers ' + (this.state.saveHeadersText ? 'SAVED' : 'unsaved')}
              title="Should we persist the headers to localStorage? Header editor is next to variable editor at the bottom."
              onClick={this.handleToggleSaveHeaders}
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    );
  }
}

export default App;
