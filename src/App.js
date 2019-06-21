import React, { Component } from 'react'
import Markdown from 'markdown-to-jsx';
import AceEditor from 'react-ace';
import brace from 'brace';
import styled from 'styled-components';
import 'brace/mode/markdown';
import 'brace/theme/dracula';

import './App.css';

const { ipcRenderer } = window.require('electron'); 
const settings = window.require('electron-settings');


const fs = window.require('fs');
class App extends Component {

  state = {
    fileContent : '',
    activeIndex : 0,
    newEntryName: '',
    newEntry  : false,
    filesData : [],
    directory : settings.get('directory') || null,
  }

  constructor(){
    super()

    const directory = settings.get('directory');
    
    if (directory) {
      this.loadAndReadFiles(directory);
    }

    ipcRenderer.on('new-file', (event, fileContent) => {
      this.setState({ fileContent })
    });

    ipcRenderer.on('new-dir', (event, directory) => {
      // set directory in state
      this.setState({ directory });
      // set directory in settings
      settings.set('directory', directory);
      // read files and push each file to state
      this.loadAndReadFiles(directory);
    });
    // Save file when user press CTRL+S
    ipcRenderer.on('save-file', event => this.saveFile())
  }

  changeFile = index => () => {
    const { activeIndex } = this.state;
    if (activeIndex !== index) {
      this.saveFile();
      this.loadFile(index)
    }
  }

  loadFile = index => {
    const { filesData } = this.state;

    const content = fs.readFileSync(filesData[index].path).toString();
    this.setState({ fileContent : content, activeIndex : index })
  }

  loadAndReadFiles = directory => {
    fs.readdir(directory, (err, files) => {
      const filteredFiles = files.filter(file => file.includes('.md'))
      const filesData = filteredFiles.map(file => {
        
        const title = file.substr(
          file.indexOf('_') +1,
          file.indexOf('.') - file.indexOf('_') -1
        )

        return {
          title,
          path : `${directory}/${file}`,
        }
      });

      this.setState({ filesData }, () => this.loadFile(0))
    })
  }

  newFile = e => {
    e.preventDefault();

    const { newEntryName, directory, filesData } = this.state;
    
    const fileDate = new Date();
    const filePath = `${directory}/${newEntryName}.md`;

    fs.writeFile(filePath, '', err => {
      if (err) console.log(err);

      filesData.unshift({
        path : filePath,
        title : newEntryName
      })

      this.setState({ newEntry : false, newEntryName : '', filesData, fileContent: '' })
    })

  }

  saveFile = () => {
    const { activeIndex, fileContent, filesData } = this.state;
    fs.writeFile(filesData[activeIndex].path, fileContent, err => {
      if (err) return console.log(err);
      console.log('saved');
    });
  }

  render() {
    const { newEntryName, newEntry, activeIndex, directory, filesData, fileContent } = this.state;

    return (
      <div>
        {directory ? (
        <Split>
          <FilesWindow>
            <Button onClick={() => this.setState({ newEntry: !newEntry })}>
              + New Entry
            </Button>
            {newEntry &&
              <form onSubmit={this.newFile}>
                <input 
                  value={newEntryName} 
                  onChange={(e => this.setState({ newEntryName : e.target.value }))} 
                  autoFocus 
                  type="text"/>
              </form>
            }
            {filesData.map((file, idx) => (
              <FilesButton key={idx} active={activeIndex === idx} onClick={this.changeFile(idx)}>{file.title}</FilesButton>
            ))}
          </FilesWindow>
          <CodeWindow>
            <AceEditor 
              onChange={newContent => {
                this.setState({ fileContent : newContent })
              }}
              name="markdown_editor"
              value={fileContent}
              theme="dracula"
              mode="markdown">
            </AceEditor>
          </CodeWindow>
          <RendererWindow>
            <Markdown>
              {fileContent}  
            </Markdown>
          </RendererWindow>
        </Split>
        ) : (
          <LoadingMessage>
            <h1>Press Ctrl+O to Open Directory</h1>
          </LoadingMessage>
        )}
      </div>
    )
  }
}

export default App;

const FilesWindow = styled.div`
  background: #140f1d;
  border-right: 1px solid #302b3a;
  position: relative;
  width: 20%;
  &:after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    box-shadow: -10px 0 20px rgba(0, 0, 0, .3) inset;
    pointer-events: none;
  }
`

const Split = styled.div`
  display: flex;
  height: 100vh;
`

const LoadingMessage = styled.div`
  display: flex;
  color: white;
  align-items: center;
  justify-content: center;
  background-color: #191324;
  height: 100vh;
`

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: #191324;
`

const RendererWindow = styled.div`
  background-color: #191324;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #302b3a; 
  h1, h2, h3, h4, h5, h6 {
    color: #82d8b8;
  }

  h1 {
    border-bottom: solid 3px #e54b4b;
    padding-bottom: 10px;
  }

  a {
    color: #e54b4b;
  }
`
const FilesButton = styled.div`
  padding: 10px;
  width: 100%;
  background: #191324;
  opacity: 0.4;
  color: white;
  border: none;
  border-bottom: solid 1px #302b3a;
  transition: 0.3s ease all;
  &:hover {
    opacity: 1;
    border-left: solid 4px #82d8d8;
  }
  ${({active}) => active && `
    opacity: 1;
    border-left: solid 4px #82d8d8; 
  `}
`

const Button = styled.button`
  background: transparent;
  color: white;
  border: 1px solid #82d8d8;
  border-radius: 4px;
  margin: 1rem auto;
  font-size: 1rem;
  transition: 0.3s ease all;
  padding: 5px 10px;
  display: block;
  &:hover {
    background: #82d8d8;
    color: #191324;
  }
`